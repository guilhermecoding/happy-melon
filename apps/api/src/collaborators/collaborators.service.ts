import { randomBytes } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { COLLABORATOR_EVENT_TYPE, CONTEST_ACCESS_EVENT_TYPE } from '@repo/shared';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
} from '@repo/database';
import { auth } from '../auth/auth.js';
import { revokeStaffSessionsForCollaborator } from '../auth/staff-session-access.js';
import { ContestAccessEventsService } from '../contests/contest-access.events.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isPrismaUniqueViolation,
} from '../common/short-id.js';
import type {
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from './dto/collaborator.dto.js';
import { CollaboratorsEventsService } from './collaborators.events.js';

const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

type CollaboratorScore = {
  id: string;
  name: string;
  email: string;
  deliveredCount: number;
  totalDurationMs: number;
  lastDeliveredAt: string | null;
};

type DeliveryStats = {
  deliveredCount: number;
  totalDurationMs: number;
  lastDeliveredAt: Date | null;
};

type TaskHistoryEvents = {
  processingByActor: Map<string, Date[]>;
  deliveredAt: Date | null;
};

function compareCollaboratorScores(
  a: CollaboratorScore,
  b: CollaboratorScore,
) {
  if (b.deliveredCount !== a.deliveredCount) {
    return b.deliveredCount - a.deliveredCount;
  }

  if (a.totalDurationMs !== b.totalDurationMs) {
    return a.totalDurationMs - b.totalDurationMs;
  }

  const aLast = a.lastDeliveredAt
    ? Date.parse(a.lastDeliveredAt)
    : Number.POSITIVE_INFINITY;
  const bLast = b.lastDeliveredAt
    ? Date.parse(b.lastDeliveredAt)
    : Number.POSITIVE_INFINITY;

  if (aLast !== bLast) {
    return aLast - bLast;
  }

  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
}

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly collaboratorsEvents: CollaboratorsEventsService,
    private readonly contestAccessEvents: ContestAccessEventsService,
  ) { }

  async list(competitionId: string) {
    await this.ensureCompetitionExists(competitionId);

    const memberships = await prisma.contestCollaborator.findMany({
      where: { competitionId },
      orderBy: { createdAt: 'asc' },
    });

    if (memberships.length === 0) {
      return [];
    }

    const userIds = memberships.map((membership) => membership.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));
    const lastSessionByUserId = await this.getLastSessionByUserIds(userIds);

    return memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId);
      if (!user || user.role !== 'staff') {
        return [];
      }

      const lastSession = lastSessionByUserId.get(user.id);

      return [
        this.toCollaborator(
          user,
          lastSession?.lastAccess ?? null,
          lastSession?.ipAddress ?? null,
          membership.hasAccess,
        ),
      ];
    });
  }

  async listScore(competitionId: string) {
    await this.ensureCompetitionExists(competitionId);

    const memberships = await prisma.contestCollaborator.findMany({
      where: { competitionId },
      orderBy: { createdAt: 'asc' },
    });

    if (memberships.length === 0) {
      return [];
    }

    const userIds = memberships.map((membership) => membership.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    const collaborators = memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId);
      if (!user || user.role !== 'staff') {
        return [];
      }

      return [user];
    });

    const statsByUserId = await this.getDeliveryStatsByUserId(competitionId);

    return collaborators
      .map((user) => {
        const stats = statsByUserId.get(user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          deliveredCount: stats?.deliveredCount ?? 0,
          totalDurationMs: stats?.totalDurationMs ?? 0,
          lastDeliveredAt: stats?.lastDeliveredAt?.toISOString() ?? null,
        };
      })
      .sort(compareCollaboratorScores);
  }

  async create(
    headers: IncomingHttpHeaders,
    competitionId: string,
    dto: CreateCollaboratorDto,
  ) {
    await this.ensureCompetitionExists(competitionId);

    const email = dto.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser?.role === 'admin') {
      throw new ConflictException(
        'Este e-mail pertence a um administrador do sistema.',
      );
    }

    if (existingUser?.role === 'chef') {
      throw new ConflictException(
        'Este e-mail pertence a um chefe de sala.',
      );
    }

    let userId: string;
    let name = dto.name.trim();
    let userEmail = email;

    if (existingUser) {
      const alreadyMember = await prisma.contestCollaborator.findUnique({
        where: {
          competitionId_userId: {
            competitionId,
            userId: existingUser.id,
          },
        },
      });

      if (alreadyMember) {
        throw new ConflictException(
          'Este colaborador já está vinculado a esta competição.',
        );
      }

      userId = existingUser.id;
      name = existingUser.name;
      userEmail = existingUser.email;
    } else {
      const temporaryPassword = this.generateTemporaryPassword();

      try {
        const { user } = await auth.api.createUser({
          body: {
            name: dto.name.trim(),
            email,
            password: temporaryPassword,
            role: 'staff',
            data: {
              emailVerified: true,
            },
          },
        });

        userId = user.id;
        name = user.name;
        userEmail = user.email;
      } catch (error) {
        this.rethrowApiError(error);
      }
    }

    try {
      await this.createMembership(competitionId, userId);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictException(
          'Este colaborador já está vinculado a esta competição.',
        );
      }
      throw error;
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const lastSessionByUserId = await this.getLastSessionByUserIds([userId]);
    const lastSession = lastSessionByUserId.get(userId);

    const collaborator = this.toCollaborator(
      {
        ...user,
        name,
        email: userEmail,
      },
      lastSession?.lastAccess ?? null,
      lastSession?.ipAddress ?? null,
      true,
    );

    this.collaboratorsEvents.emit(competitionId, {
      type: COLLABORATOR_EVENT_TYPE.JOINED,
      collaborator,
    });

    return collaborator;
  }

  async update(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
    dto: UpdateCollaboratorDto,
  ) {
    await this.ensureMembership(competitionId, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (user.role !== 'staff') {
      throw new ForbiddenException(
        'Não é possível editar este usuário por esta tela.',
      );
    }

    try {
      const refreshed = await prisma.user.update({
        where: { id: userId },
        data: { name: dto.name.trim() },
      });
      const membership = await prisma.contestCollaborator.findUniqueOrThrow({
        where: {
          competitionId_userId: { competitionId, userId },
        },
      });
      const lastSessionByUserId = await this.getLastSessionByUserIds([userId]);
      const lastSession = lastSessionByUserId.get(userId);

      return this.toCollaborator(
        {
          ...refreshed,
          name: refreshed.name,
          email: refreshed.email,
        },
        lastSession?.lastAccess ?? null,
        lastSession?.ipAddress ?? null,
        membership.hasAccess,
      );
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async setAccess(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
    hasAccess: boolean,
  ) {
    await this.ensureMembership(competitionId, userId);

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (existing.role !== 'staff') {
      throw new ForbiddenException(
        'Não é possível alterar o acesso deste usuário por esta tela.',
      );
    }

    try {
      await prisma.contestCollaborator.update({
        where: {
          competitionId_userId: { competitionId, userId },
        },
        data: { hasAccess },
      });

      if (!hasAccess) {
        await revokeStaffSessionsForCollaborator(competitionId, userId);
        this.contestAccessEvents.emit(competitionId, {
          type: CONTEST_ACCESS_EVENT_TYPE.COLLABORATOR_REVOKED,
          contestId: competitionId,
          userId,
        });
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const lastSessionByUserId = await this.getLastSessionByUserIds([userId]);
      const lastSession = lastSessionByUserId.get(userId);

      return this.toCollaborator(
        user,
        lastSession?.lastAccess ?? null,
        lastSession?.ipAddress ?? null,
        hasAccess,
      );
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async remove(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
  ) {
    await this.ensureMembership(competitionId, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (user.role !== 'staff') {
      throw new ForbiddenException(
        'Não é possível remover este usuário por esta tela.',
      );
    }

    await prisma.contestCollaborator.delete({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    const remainingMemberships = await prisma.contestCollaborator.count({
      where: { userId },
    });

    if (remainingMemberships === 0 && user.role === 'staff') {
      await prisma.user.delete({ where: { id: userId } });
    }

    return { success: true as const };
  }

  private async getDeliveryStatsByUserId(
    competitionId: string,
  ): Promise<Map<string, DeliveryStats>> {
    const deliveredStatus = PrismaBalloonDeliveryStatus.DELIVERED;
    const processingStatus = PrismaBalloonDeliveryStatus.PROCESSING;

    const [balloons, prints] = await Promise.all([
      prisma.balloonDelivery.findMany({
        where: {
          contest: { competitionId },
          status: deliveredStatus,
          claimedByUserId: { not: null },
        },
        select: { id: true, claimedByUserId: true },
      }),
      prisma.printTask.findMany({
        where: {
          contest: { competitionId },
          status: deliveredStatus,
          claimedByUserId: { not: null },
        },
        select: { id: true, claimedByUserId: true },
      }),
    ]);

    const deliveredTasks = [...balloons, ...prints];
    const statsByUserId = new Map<string, DeliveryStats>();

    if (deliveredTasks.length === 0) {
      return statsByUserId;
    }

    const history = await prisma.taskHistory.findMany({
      where: {
        contest: { competitionId },
        relatedTaskId: { in: deliveredTasks.map((task) => task.id) },
        status: { in: [processingStatus, deliveredStatus] },
      },
      select: {
        relatedTaskId: true,
        actorUserId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const eventsByTask = new Map<string, TaskHistoryEvents>();

    for (const entry of history) {
      const taskId = entry.relatedTaskId;
      if (!taskId) {
        continue;
      }

      let events = eventsByTask.get(taskId);
      if (!events) {
        events = { processingByActor: new Map(), deliveredAt: null };
        eventsByTask.set(taskId, events);
      }

      if (entry.status === processingStatus) {
        const times = events.processingByActor.get(entry.actorUserId) ?? [];
        times.push(entry.createdAt);
        events.processingByActor.set(entry.actorUserId, times);
        continue;
      }

      events.deliveredAt = entry.createdAt;
    }

    for (const task of deliveredTasks) {
      const userId = task.claimedByUserId;
      if (!userId) {
        continue;
      }

      let stats = statsByUserId.get(userId);
      if (!stats) {
        stats = {
          deliveredCount: 0,
          totalDurationMs: 0,
          lastDeliveredAt: null,
        };
        statsByUserId.set(userId, stats);
      }

      stats.deliveredCount += 1;

      const events = eventsByTask.get(task.id);
      const deliveredAt = events?.deliveredAt;
      if (!deliveredAt) {
        continue;
      }

      if (!stats.lastDeliveredAt || deliveredAt > stats.lastDeliveredAt) {
        stats.lastDeliveredAt = deliveredAt;
      }

      const processingTimes = events?.processingByActor.get(userId) ?? [];
      let lastProcessing: Date | undefined;
      for (let index = processingTimes.length - 1; index >= 0; index -= 1) {
        const time = processingTimes[index];
        if (time && time.getTime() <= deliveredAt.getTime()) {
          lastProcessing = time;
          break;
        }
      }

      if (lastProcessing) {
        stats.totalDurationMs += Math.max(
          0,
          deliveredAt.getTime() - lastProcessing.getTime(),
        );
      }
    }

    return statsByUserId;
  }

  private async ensureCompetitionExists(competitionId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true },
    });

    if (!competition) {
      throw new NotFoundException('Competição não encontrada.');
    }

    return competition;
  }

  private async ensureMembership(competitionId: string, userId: string) {
    await this.ensureCompetitionExists(competitionId);

    const membership = await prisma.contestCollaborator.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Colaborador não encontrado nesta competição.');
    }

    return membership;
  }

  private async createMembership(competitionId: string, userId: string) {
    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.contestCollaborator.create({
          data: {
            id: generateShortId(),
            competitionId,
            userId,
            hasAccess: true,
          },
        });
      } catch (error) {
        if (isPrismaUniqueViolation(error) && !isIdUniqueViolation(error)) {
          throw error;
        }

        if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  private toCollaborator(
    user: {
      id: string;
      name: string;
      email: string;
      banned?: boolean | null;
      createdAt: Date;
    },
    lastAccess: string | null,
    ipAddress: string | null,
    membershipHasAccess: boolean,
  ) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAccess: membershipHasAccess && !user.banned,
      lastAccess,
      ipAddress,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async getLastSessionByUserIds(
    userIds: string[],
  ): Promise<Map<string, { lastAccess: string; ipAddress: string | null }>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const sessions = await prisma.session.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        updatedAt: true,
        ipAddress: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const lastSessionByUserId = new Map<
      string,
      { lastAccess: string; ipAddress: string | null }
    >();

    for (const session of sessions) {
      if (lastSessionByUserId.has(session.userId)) {
        continue;
      }

      lastSessionByUserId.set(session.userId, {
        lastAccess: session.updatedAt.toISOString(),
        ipAddress: session.ipAddress,
      });
    }

    return lastSessionByUserId;
  }

  private generateTemporaryPassword(): string {
    return Array.from(
      randomBytes(16),
      (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]!,
    ).join('');
  }

  private extractApiErrorMessage(error: APIError): string {
    const body: unknown = error.body;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      if (Array.isArray(message)) {
        return message.map(String).join(', ');
      }
    }

    return error.message || 'Erro inesperado ao processar a solicitação.';
  }

  private isDuplicateEmailError(statusCode: number, message: string): boolean {
    if (
      /already exists|user.?exists|email.?already|unique constraint|duplicate/i.test(
        message,
      )
    ) {
      return true;
    }

    return statusCode === HttpStatus.CONFLICT;
  }

  private rethrowApiError(error: unknown): never {
    if (error instanceof APIError) {
      const statusCode =
        typeof error.statusCode === 'number'
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = this.extractApiErrorMessage(error);

      if (this.isDuplicateEmailError(statusCode, message)) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }

      throw new HttpException(message, statusCode);
    }

    throw error;
  }
}
