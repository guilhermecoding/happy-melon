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
import { fromNodeHeaders } from 'better-auth/node';
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
  ) {}

  async list(contestId: string) {
    await this.ensureContestExists(contestId);

    const memberships = await prisma.contestCollaborator.findMany({
      where: { contestId },
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
      if (!user || user.role === 'admin') {
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

  async listScore(contestId: string) {
    await this.ensureContestExists(contestId);

    const memberships = await prisma.contestCollaborator.findMany({
      where: { contestId },
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
      if (!user || user.role === 'admin') {
        return [];
      }

      return [user];
    });

    const statsByUserId = await this.getDeliveryStatsByUserId(contestId);

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
    contestId: string,
    dto: CreateCollaboratorDto,
  ) {
    await this.ensureContestExists(contestId);

    const email = dto.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser?.role === 'admin') {
      throw new ConflictException(
        'Este e-mail pertence a um administrador do sistema.',
      );
    }

    let userId: string;
    let name = dto.name.trim();
    let userEmail = email;

    if (existingUser) {
      const alreadyMember = await prisma.contestCollaborator.findUnique({
        where: {
          contestId_userId: {
            contestId,
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
          headers: this.toAuthHeaders(headers),
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
      await this.createMembership(contestId, userId);
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

    this.collaboratorsEvents.emit(contestId, {
      type: COLLABORATOR_EVENT_TYPE.JOINED,
      collaborator,
    });

    return collaborator;
  }

  async update(
    headers: IncomingHttpHeaders,
    contestId: string,
    userId: string,
    dto: UpdateCollaboratorDto,
  ) {
    await this.ensureMembership(contestId, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Não é possível editar um administrador por esta tela.',
      );
    }

    try {
      const updated = await auth.api.adminUpdateUser({
        headers: this.toAuthHeaders(headers),
        body: {
          userId,
          data: {
            name: dto.name.trim(),
          },
        },
      });

      const refreshed = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const membership = await prisma.contestCollaborator.findUniqueOrThrow({
        where: {
          contestId_userId: { contestId, userId },
        },
      });
      const lastSessionByUserId = await this.getLastSessionByUserIds([userId]);
      const lastSession = lastSessionByUserId.get(userId);

      return this.toCollaborator(
        {
          ...refreshed,
          name: updated.name,
          email: updated.email,
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
    contestId: string,
    userId: string,
    hasAccess: boolean,
  ) {
    await this.ensureMembership(contestId, userId);

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (existing.role === 'admin') {
      throw new ForbiddenException(
        'Não é possível alterar o acesso de um administrador por esta tela.',
      );
    }

    try {
      const authHeaders = this.toAuthHeaders(headers);

      await prisma.contestCollaborator.update({
        where: {
          contestId_userId: { contestId, userId },
        },
        data: { hasAccess },
      });

      if (hasAccess) {
        await auth.api.unbanUser({
          headers: authHeaders,
          body: { userId },
        });
      } else {
        await auth.api.banUser({
          headers: authHeaders,
          body: {
            userId,
            banReason: 'Acesso ao sistema desabilitado',
          },
        });
        await revokeStaffSessionsForCollaborator(contestId, userId);
        this.contestAccessEvents.emit(contestId, {
          type: CONTEST_ACCESS_EVENT_TYPE.COLLABORATOR_REVOKED,
          contestId,
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
    contestId: string,
    userId: string,
  ) {
    await this.ensureMembership(contestId, userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Não é possível remover um administrador por esta tela.',
      );
    }

    await prisma.contestCollaborator.delete({
      where: {
        contestId_userId: { contestId, userId },
      },
    });

    const remainingMemberships = await prisma.contestCollaborator.count({
      where: { userId },
    });

    if (remainingMemberships === 0 && user.role === 'staff') {
      try {
        await auth.api.removeUser({
          headers: this.toAuthHeaders(headers),
          body: { userId },
        });
      } catch (error) {
        this.rethrowApiError(error);
      }
    }

    return { success: true as const };
  }

  private async getDeliveryStatsByUserId(
    contestId: string,
  ): Promise<Map<string, DeliveryStats>> {
    const deliveredStatus = PrismaBalloonDeliveryStatus.DELIVERED;
    const processingStatus = PrismaBalloonDeliveryStatus.PROCESSING;

    const [balloons, prints] = await Promise.all([
      prisma.balloonDelivery.findMany({
        where: {
          contestId,
          status: deliveredStatus,
          claimedByUserId: { not: null },
        },
        select: { id: true, claimedByUserId: true },
      }),
      prisma.printTask.findMany({
        where: {
          contestId,
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
        contestId,
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

  private async ensureContestExists(contestId: string) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      throw new NotFoundException('Competição não encontrada.');
    }

    return contest;
  }

  private async ensureMembership(contestId: string, userId: string) {
    await this.ensureContestExists(contestId);

    const membership = await prisma.contestCollaborator.findUnique({
      where: {
        contestId_userId: { contestId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Colaborador não encontrado nesta competição.');
    }

    return membership;
  }

  private async createMembership(contestId: string, userId: string) {
    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.contestCollaborator.create({
          data: {
            id: generateShortId(),
            contestId,
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

  private toAuthHeaders(headers: IncomingHttpHeaders): Headers {
    if (typeof fromNodeHeaders === 'function') {
      return fromNodeHeaders(headers);
    }

    const authHeaders = new Headers();

    for (const [name, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          authHeaders.append(name, item);
        }
      } else if (value !== undefined) {
        authHeaders.set(name, value);
      }
    }

    return authHeaders;
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
