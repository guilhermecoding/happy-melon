import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma, type Team } from '@repo/database';
import { auth } from '../auth/auth.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isPrismaUniqueViolation,
  isUniqueViolationOn,
} from '../common/short-id.js';
import type {
  BulkUpsertTeamsDto,
  CreateTeamDto,
  DeleteTeamDto,
  UpdateTeamDto,
} from './dto/team.dto.js';

@Injectable()
export class TeamsService {
  async listByContest(contestId: string) {
    await this.ensureContestExists(contestId);

    const teams = await prisma.team.findMany({
      where: { contestId },
      orderBy: { name: 'asc' },
    });

    return teams.map((team) => this.toResponse(team));
  }

  async create(contestId: string, dto: CreateTeamDto) {
    await this.ensureContestExists(contestId);
    await this.ensureUsernameAvailable(contestId, dto.usernameTeam);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const team = await prisma.team.create({
          data: {
            id: generateShortId(),
            contestId,
            name: dto.name,
            usernameTeam: dto.usernameTeam,
            room: dto.room,
            machine: dto.machine,
          },
        });

        return this.toResponse(team);
      } catch (error) {
        if (this.isUsernameUniqueViolation(error)) {
          throw new BadRequestException(
            'Já existe um time com este usuário nesta competição.',
          );
        }

        if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  async bulkUpsert(contestId: string, dto: BulkUpsertTeamsDto) {
    await this.ensureContestExists(contestId);

    const existingTeams = await prisma.team.findMany({
      where: { contestId },
      select: {
        id: true,
        usernameTeam: true,
      },
    });

    const existingByUsername = new Map(
      existingTeams.map((team) => [
        team.usernameTeam.toLowerCase(),
        team.id,
      ]),
    );

    const results: Team[] = [];

    for (const item of dto.teams) {
      const existingId = existingByUsername.get(item.usernameTeam);

      if (existingId) {
        const updated = await prisma.team.update({
          where: { id: existingId },
          data: {
            name: item.name,
            room: item.room,
            machine: item.machine,
          },
        });
        results.push(updated);
        continue;
      }

      let created: Team | undefined;

      for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
        try {
          created = await prisma.team.create({
            data: {
              id: generateShortId(),
              contestId,
              name: item.name,
              usernameTeam: item.usernameTeam,
              room: item.room,
              machine: item.machine,
            },
          });
          break;
        } catch (error) {
          if (this.isUsernameUniqueViolation(error)) {
            const raced = await prisma.team.findFirst({
              where: {
                contestId,
                usernameTeam: {
                  equals: item.usernameTeam,
                  mode: 'insensitive',
                },
              },
            });

            if (raced) {
              created = await prisma.team.update({
                where: { id: raced.id },
                data: {
                  name: item.name,
                  room: item.room,
                  machine: item.machine,
                },
              });
              existingByUsername.set(item.usernameTeam, raced.id);
              break;
            }
          }

          if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
            continue;
          }

          throw error;
        }
      }

      if (!created) {
        throw new InternalServerErrorException(
          `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
        );
      }

      existingByUsername.set(item.usernameTeam, created.id);
      results.push(created);
    }

    return results.map((team) => this.toResponse(team));
  }

  async update(id: string, dto: UpdateTeamDto) {
    const existing = await prisma.team.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Time não encontrado.');
    }

    await this.ensureUsernameAvailable(
      existing.contestId,
      dto.usernameTeam,
      id,
    );

    try {
      const team = await prisma.team.update({
        where: { id },
        data: {
          name: dto.name,
          usernameTeam: dto.usernameTeam,
          room: dto.room,
          machine: dto.machine,
        },
      });

      return this.toResponse(team);
    } catch (error) {
      if (this.isUsernameUniqueViolation(error)) {
        throw new BadRequestException(
          'Já existe um time com este usuário nesta competição.',
        );
      }

      throw error;
    }
  }

  async remove(
    headers: IncomingHttpHeaders,
    id: string,
    dto: DeleteTeamDto,
  ) {
    const existing = await prisma.team.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Time não encontrado.');
    }

    await this.verifyAdminPassword(headers, dto.password);

    await prisma.team.delete({ where: { id } });

    return { success: true as const };
  }

  async removeAllByContest(
    headers: IncomingHttpHeaders,
    contestId: string,
    dto: DeleteTeamDto,
  ) {
    await this.ensureContestExists(contestId);
    await this.verifyAdminPassword(headers, dto.password);

    const result = await prisma.team.deleteMany({
      where: { contestId },
    });

    return {
      success: true as const,
      deletedCount: result.count,
    };
  }

  private async ensureUsernameAvailable(
    contestId: string,
    usernameTeam: string,
    excludeId?: string,
  ) {
    const existing = await prisma.team.findFirst({
      where: {
        contestId,
        usernameTeam: { equals: usernameTeam, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Já existe um time com este usuário nesta competição.',
      );
    }
  }

  private isUsernameUniqueViolation(error: unknown): boolean {
    if (isUniqueViolationOn(error, 'usernameTeam')) {
      return true;
    }

    return isPrismaUniqueViolation(error) && !isIdUniqueViolation(error);
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

  private async ensureContestExists(contestId: string) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { id: true },
    });

    if (!contest) {
      throw new NotFoundException('Competição não encontrada.');
    }
  }

  private toResponse(team: Team) {
    return {
      id: team.id,
      contestId: team.contestId,
      name: team.name,
      usernameTeam: team.usernameTeam,
      room: team.room,
      machine: team.machine,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }
}
