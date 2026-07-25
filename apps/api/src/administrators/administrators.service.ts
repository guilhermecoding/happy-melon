import { randomBytes } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth/auth.js';
import type {
  CreateAdministratorDto,
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

      return result.users
        .filter((user) => user.role === 'admin' || user.role === 'staff')
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          hasAccess: !user.banned,
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
    try {
      const user = await auth.api.adminUpdateUser({
        headers: this.toAuthHeaders(headers),
        body: {
          userId: id,
          data: dto,
        },
      });

      return this.toAdministrator(user);
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

      return this.toAdministrator(user);
    } catch (error) {
      this.rethrowApiError(error);
    }
  }

  private toAdministrator(user: {
    id: string;
    name: string;
    email: string;
    banned?: boolean | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAccess: !user.banned,
    };
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

  private rethrowApiError(error: unknown): never {
    if (error instanceof APIError) {
      const statusCode =
        typeof error.statusCode === 'number'
          ? error.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(error.body ?? error.message, statusCode);
    }

    throw error;
  }
}
