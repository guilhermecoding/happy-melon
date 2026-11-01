import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma, type Team } from '@repo/database';
import { TEAM_EVENT_TYPE } from '@repo/shared';
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
  UpdateTeamPlacementDto,
} from './dto/team.dto.js';
import { TeamsEventsService } from './teams.events.js';

const PLACEMENT_CONFLICT_MESSAGE =
  'Sala e máquina foram alteradas por outra pessoa. Revise e salve de novo.';

@Injectable()
export class TeamsService {
  constructor(private readonly teamsEvents: TeamsEventsService) {}

  async listByCompetition(competitionId: string) {
    await this.ensureCompetitionExists(competitionId);

    const teams = await prisma.team.findMany({
      where: { competitionId },
      orderBy: { name: 'asc' },
    });

    return teams.map((team) => this.toResponse(team));
  }

  async create(competitionId: string, dto: CreateTeamDto) {
    await this.ensureCompetitionExists(competitionId);
    await this.ensureUsernameAvailable(competitionId, dto.usernameTeam);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const team = await prisma.team.create({
          data: {
            id: generateShortId(),
            competitionId,
            name: dto.name,
            usernameTeam: dto.usernameTeam,
            room: dto.room,
            machine: dto.machine,
          },
        });

        return this.publishUpserted(team);
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

  async bulkUpsert(competitionId: string, dto: BulkUpsertTeamsDto) {
    await this.ensureCompetitionExists(competitionId);

    const existingTeams = await prisma.team.findMany({
      where: { competitionId },
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
              competitionId,
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
                competitionId,
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

    const responses = results.map((team) => this.toResponse(team));
    for (const team of responses) {
      this.publish(team);
    }
    return responses;
  }

  async update(id: string, dto: UpdateTeamDto) {
    const existing = await prisma.team.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Time não encontrado.');
    }

    await this.ensureUsernameAvailable(
      existing.competitionId,
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

      return this.publishUpserted(team);
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
    this.publishRemoved(existing.competitionId, id);

    return { success: true as const };
  }

  async removeAllByCompetition(
    headers: IncomingHttpHeaders,
    competitionId: string,
    dto: DeleteTeamDto,
  ) {
    await this.ensureCompetitionExists(competitionId);
    await this.verifyAdminPassword(headers, dto.password);

    const existing = await prisma.team.findMany({
      where: { competitionId },
      select: { id: true },
    });

    const result = await prisma.team.deleteMany({
      where: { competitionId },
    });

    for (const team of existing) {
      this.publishRemoved(competitionId, team.id);
    }

    return {
      success: true as const,
      deletedCount: result.count,
    };
  }

  async updatePlacement(
    competitionId: string,
    teamId: string,
    dto: UpdateTeamPlacementDto,
  ) {
    await this.ensureCompetitionExists(competitionId);

    const existing = await prisma.team.findFirst({
      where: { id: teamId, competitionId },
    });

    if (!existing) {
      throw new NotFoundException('Time não encontrado.');
    }

    const expected = new Date(dto.updatedAt);
    if (existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictException({
        message: PLACEMENT_CONFLICT_MESSAGE,
        team: this.toResponse(existing),
      });
    }

    const written = await prisma.team.updateMany({
      where: {
        id: teamId,
        competitionId,
        updatedAt: existing.updatedAt,
      },
      data: {
        room: dto.room,
        machine: dto.machine,
      },
    });

    if (written.count === 0) {
      const current = await prisma.team.findFirst({
        where: { id: teamId, competitionId },
      });

      if (!current) {
        throw new NotFoundException('Time não encontrado.');
      }

      throw new ConflictException({
        message: PLACEMENT_CONFLICT_MESSAGE,
        team: this.toResponse(current),
      });
    }

    const team = await prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });

    return this.publishUpserted(team);
  }

  private async ensureUsernameAvailable(
    competitionId: string,
    usernameTeam: string,
    excludeId?: string,
  ) {
    const existing = await prisma.team.findFirst({
      where: {
        competitionId,
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

  private async ensureCompetitionExists(competitionId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true },
    });

    if (!competition) {
      throw new NotFoundException('Competição não encontrada.');
    }
  }

  private publishUpserted(team: Team) {
    const response = this.toResponse(team);
    this.publish(response);
    return response;
  }

  private publish(team: ReturnType<TeamsService['toResponse']>) {
    this.teamsEvents.emit(team.competitionId, {
      type: TEAM_EVENT_TYPE.UPSERTED,
      team,
    });
  }

  private publishRemoved(competitionId: string, teamId: string) {
    this.teamsEvents.emit(competitionId, {
      type: TEAM_EVENT_TYPE.REMOVED,
      teamId,
    });
  }

  private toResponse(team: Team) {
    return {
      id: team.id,
      competitionId: team.competitionId,
      name: team.name,
      usernameTeam: team.usernameTeam,
      room: team.room,
      machine: team.machine,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }
}
