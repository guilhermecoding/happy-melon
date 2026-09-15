import { randomBytes } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from '@repo/database';
import { auth } from '../auth/auth.js';
import { revokeChefSessionsForCompetition } from '../auth/staff-session-access.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isPrismaUniqueViolation,
} from '../common/short-id.js';
import type {
  CreateChefDto,
  DeleteChefDto,
  ResetPasswordChefDto,
  UpdateChefDto,
} from './dto/chef.dto.js';

const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class ChefsService {
  async list(competitionId: string) {
    await this.ensureCompetitionExists(competitionId);

    const memberships = await prisma.contestChef.findMany({
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
    const lastAccessByUserId = await this.getLastAccessByUserIds(userIds);

    return memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId);
      if (!user || user.role !== 'chef') {
        return [];
      }

      return [
        this.toChef(
          user,
          lastAccessByUserId.get(user.id) ?? null,
          membership.hasAccess,
        ),
      ];
    });
  }

  async create(
    headers: IncomingHttpHeaders,
    competitionId: string,
    dto: CreateChefDto,
  ) {
    await this.ensureCompetitionExists(competitionId);

    const email = dto.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser?.role === 'admin') {
      throw new ConflictException(
        'Este e-mail pertence a um administrador do sistema.',
      );
    }

    if (existingUser?.role === 'staff') {
      throw new ConflictException(
        'Este e-mail pertence a um colaborador.',
      );
    }

    if (existingUser && existingUser.role !== 'chef') {
      throw new ConflictException(
        'Este e-mail já está em uso por outro tipo de usuário.',
      );
    }

    let userId: string;
    let temporaryPassword: string | undefined;

    if (existingUser) {
      const alreadyMember = await prisma.contestChef.findUnique({
        where: {
          competitionId_userId: {
            competitionId,
            userId: existingUser.id,
          },
        },
      });

      if (alreadyMember) {
        throw new ConflictException(
          'Este chefe já está vinculado a esta competição.',
        );
      }

      userId = existingUser.id;
    } else {
      temporaryPassword = this.generateTemporaryPassword();

      try {
        const { user } = await auth.api.createUser({
          headers: this.toAuthHeaders(headers),
          body: {
            name: dto.name.trim(),
            email,
            password: temporaryPassword,
            role: 'chef',
            data: {
              emailVerified: true,
            },
          },
        });

        userId = user.id;
      } catch (error) {
        this.rethrowApiError(error);
      }
    }

    try {
      await this.createMembership(competitionId, userId);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictException(
          'Este chefe já está vinculado a esta competição.',
        );
      }
      throw error;
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const lastAccessByUserId = await this.getLastAccessByUserIds([userId]);
    const chef = this.toChef(
      user,
      lastAccessByUserId.get(userId) ?? null,
      true,
    );

    if (temporaryPassword) {
      return { ...chef, temporaryPassword };
    }

    return chef;
  }

  async update(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
    dto: UpdateChefDto,
  ) {
    await this.ensureMembership(competitionId, userId);
    await this.assertChef(userId);

    try {
      const user = await auth.api.adminUpdateUser({
        headers: this.toAuthHeaders(headers),
        body: {
          userId,
          data: {
            name: dto.name.trim(),
            email: dto.email.toLowerCase().trim(),
          },
        },
      });

      const membership = await prisma.contestChef.findUniqueOrThrow({
        where: {
          competitionId_userId: { competitionId, userId },
        },
      });
      const lastAccessByUserId = await this.getLastAccessByUserIds([userId]);

      return this.toChef(
        user,
        lastAccessByUserId.get(userId) ?? null,
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
    await this.assertChef(userId);

    await prisma.contestChef.update({
      where: {
        competitionId_userId: { competitionId, userId },
      },
      data: { hasAccess },
    });

    if (!hasAccess) {
      await revokeChefSessionsForCompetition(competitionId, userId);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const lastAccessByUserId = await this.getLastAccessByUserIds([userId]);

    return this.toChef(
      user,
      lastAccessByUserId.get(userId) ?? null,
      hasAccess,
    );
  }

  async remove(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
    dto: DeleteChefDto,
  ) {
    await this.ensureMembership(competitionId, userId);
    await this.assertChef(userId);
    await this.verifyAdminPassword(headers, dto.password);

    await prisma.contestChef.delete({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    await revokeChefSessionsForCompetition(competitionId, userId);

    const remainingMemberships = await prisma.contestChef.count({
      where: { userId },
    });

    if (remainingMemberships === 0) {
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

  async resetPassword(
    headers: IncomingHttpHeaders,
    competitionId: string,
    userId: string,
    dto: ResetPasswordChefDto,
  ) {
    await this.ensureMembership(competitionId, userId);
    await this.assertChef(userId);
    await this.verifyAdminPassword(headers, dto.password);

    try {
      await auth.api.setUserPassword({
        headers: this.toAuthHeaders(headers),
        body: {
          userId,
          newPassword: dto.newPassword,
        },
      });

      return { success: true as const };
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  private async assertChef(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Chefe não encontrado.');
    }

    if (user.role !== 'chef') {
      throw new ForbiddenException(
        'Não é possível gerenciar este usuário por esta tela.',
      );
    }
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

    const membership = await prisma.contestChef.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Chefe não encontrado nesta competição.');
    }

    return membership;
  }

  private async createMembership(competitionId: string, userId: string) {
    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.contestChef.create({
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

  private toChef(
    user: {
      id: string;
      name: string;
      email: string;
      banned?: boolean | null;
    },
    lastAccess: string | null,
    membershipHasAccess: boolean,
  ) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAccess: membershipHasAccess && !user.banned,
      lastAccess,
    };
  }

  private async getLastAccessByUserIds(
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const sessions = await prisma.session.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { updatedAt: true },
    });

    return new Map(
      sessions.flatMap((session) => {
        if (!session._max.updatedAt) {
          return [];
        }

        return [[session.userId, session._max.updatedAt.toISOString()]];
      }),
    );
  }

  private async verifyAdminPassword(
    headers: IncomingHttpHeaders,
    password: string,
  ) {
    try {
      await auth.api.verifyPassword({
        headers: this.toAuthHeaders(headers),
        body: { password },
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException('Senha de administrador incorreta.');
      }

      throw error;
    }
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
      randomBytes(8),
      (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length],
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
