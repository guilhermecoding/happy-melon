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
import type {
  CreateAdministratorDto,
  DeleteAdministratorDto,
  ResetPasswordAdministratorDto,
  UpdateAdministratorDto,
} from './dto/administrator.dto.js';

const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class AdministratorsService {
  async list(headers: IncomingHttpHeaders) {
    try {
      const result = await auth.api.listUsers({
        headers: this.toAuthHeaders(headers),
        query: {
          sortBy: 'name',
          sortDirection: 'asc',
        },
      });

      const administrators = result.users.filter(
        (user) => user.role === 'admin',
      );
      const lastAccessByUserId = await this.getLastAccessByUserIds(
        administrators.map((user) => user.id),
      );

      return administrators.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        hasAccess: !user.banned,
        lastAccess: lastAccessByUserId.get(user.id) ?? null,
      }));
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async create(
    headers: IncomingHttpHeaders,
    dto: CreateAdministratorDto,
  ) {
    const temporaryPassword = this.generateTemporaryPassword();

    try {
      const { user } = await auth.api.createUser({
        headers: this.toAuthHeaders(headers),
        body: {
          ...dto,
          password: temporaryPassword,
          role: 'admin',
          data: {
            emailVerified: true,
          },
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        hasAccess: true,
        lastAccess: null,
        temporaryPassword,
      };
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async update(
    headers: IncomingHttpHeaders,
    id: string,
    dto: UpdateAdministratorDto,
  ) {
    await this.assertAdministrator(id);

    try {
      const user = await auth.api.adminUpdateUser({
        headers: this.toAuthHeaders(headers),
        body: {
          userId: id,
          data: dto,
        },
      });

      return await this.toAdministrator(user);
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async setAccess(
    headers: IncomingHttpHeaders,
    id: string,
    hasAccess: boolean,
    currentUserId: string,
  ) {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Você não pode alterar o próprio acesso ao sistema',
      );
    }

    await this.assertAdministrator(id);

    try {
      const authHeaders = this.toAuthHeaders(headers);

      if (hasAccess) {
        await auth.api.unbanUser({
          headers: authHeaders,
          body: { userId: id },
        });
      } else {
        await auth.api.banUser({
          headers: authHeaders,
          body: {
            userId: id,
            banReason: 'Acesso ao sistema desabilitado',
          },
        });
      }

      const user = await auth.api.getUser({
        headers: authHeaders,
        query: { id },
      });

      return await this.toAdministrator(user);
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async remove(
    headers: IncomingHttpHeaders,
    id: string,
    dto: DeleteAdministratorDto,
    currentUserId: string,
  ) {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Você não pode excluir a própria conta de administrador',
      );
    }

    await this.assertAdministrator(id);

    const authHeaders = this.toAuthHeaders(headers);

    try {
      await auth.api.verifyPassword({
        headers: authHeaders,
        body: {
          password: dto.password,
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException('Senha de administrador incorreta.');
      }

      throw error;
    }

    try {
      await auth.api.removeUser({
        headers: authHeaders,
        body: {
          userId: id,
        },
      });

      return { success: true as const };
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  async resetPassword(
    headers: IncomingHttpHeaders,
    id: string,
    dto: ResetPasswordAdministratorDto,
  ) {
    await this.assertAdministrator(id);

    const authHeaders = this.toAuthHeaders(headers);

    try {
      await auth.api.verifyPassword({
        headers: authHeaders,
        body: {
          password: dto.password,
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException('Senha de administrador incorreta.');
      }

      throw error;
    }

    try {
      await auth.api.setUserPassword({
        headers: authHeaders,
        body: {
          userId: id,
          newPassword: dto.newPassword,
        },
      });

      return { success: true as const };
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  private async assertAdministrator(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Administrador não encontrado.');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Não é possível gerenciar um colaborador por esta tela.',
      );
    }
  }

  private async toAdministrator(user: {
    id: string;
    name: string;
    email: string;
    banned?: boolean | null;
  }) {
    const lastAccessByUserId = await this.getLastAccessByUserIds([user.id]);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAccess: !user.banned,
      lastAccess: lastAccessByUserId.get(user.id) ?? null,
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
