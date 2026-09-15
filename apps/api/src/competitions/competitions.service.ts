import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ContestStatus,
  prisma,
  type Competition,
  type Contest,
  type Prisma,
} from '@repo/database';
import {
  CONTEST_ACCESS_EVENT_TYPE,
  STAFF_TASK_EVENT_TYPE,
  getCompetitionSchedule,
  roundsOverlap,
} from '@repo/shared';
import { revokeStaffSessionsForContest } from '../auth/staff-session-access.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isExclusionViolation,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ContestTasksEventsService } from '../contest-tasks/contest-tasks.events.js';
import { ContestAccessEventsService } from '../contests/contest-access.events.js';
import type {
  ContestStatusDto,
  CreateCompetitionDto,
  CreateRoundDto,
  StaffSettingsDto,
  UpdateCompetitionDto,
  UpdateRoundDto,
} from './dto/competition.dto.js';
import {
  assertRoundsDoNotOverlap,
  getCompetitionOrThrow,
  toRoundResponse,
} from './round-access.js';

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly contestAccessEvents: ContestAccessEventsService,
    private readonly contestTasksEvents: ContestTasksEventsService,
  ) {}

  async list() {
    const competitions = await prisma.competition.findMany({
      include: { rounds: { orderBy: { startsAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return competitions.map((competition) => this.toResponse(competition));
  }

  async findById(id: string) {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { rounds: { orderBy: { startsAt: 'asc' } } },
    });

    if (!competition) {
      throw new NotFoundException('Competição não encontrada.');
    }

    return this.toResponse(competition);
  }

  async create(dto: CreateCompetitionDto) {
    this.assertIncomingRoundsDoNotOverlap(dto.rounds);

    const status = this.toStatus(dto.status);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const competition = await prisma.$transaction(async (tx) => {
          const created = await tx.competition.create({
            data: {
              id: generateShortId(),
              name: dto.name,
              status,
              venue: dto.venue,
            },
          });

          for (const round of dto.rounds) {
            await this.createRoundInTx(tx, created.id, round);
          }

          return tx.competition.findUniqueOrThrow({
            where: { id: created.id },
            include: { rounds: { orderBy: { startsAt: 'asc' } } },
          });
        });

        return this.toResponse(competition);
      } catch (error) {
        if (isExclusionViolation(error)) {
          throw new BadRequestException(
            'O horário desta rodada se sobrepõe a outra rodada da competição.',
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

  async update(id: string, dto: UpdateCompetitionDto) {
    const existing = await getCompetitionOrThrow(id);
    const status = this.toStatus(dto.status);

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        name: dto.name,
        status,
        venue: dto.venue,
      },
      include: { rounds: { orderBy: { startsAt: 'asc' } } },
    });

    if (
      existing.status === ContestStatus.ACTIVE &&
      status === ContestStatus.INACTIVE
    ) {
      await revokeStaffSessionsForContest(id);
      this.contestAccessEvents.emit(id, {
        type: CONTEST_ACCESS_EVENT_TYPE.COLLABORATORS_DISABLED,
        contestId: id,
      });
    }

    return this.toResponse(competition);
  }

  async updateStaffSettings(id: string, dto: StaffSettingsDto) {
    await getCompetitionOrThrow(id);

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        balloonLimitEnabled: dto.balloonLimitEnabled,
        balloonLimit: dto.balloonLimitEnabled ? dto.balloonLimit : null,
        deliveryTimeoutEnabled: dto.deliveryTimeoutEnabled,
        deliveryTimeoutMinutes: dto.deliveryTimeoutEnabled
          ? dto.deliveryTimeoutMinutes
          : null,
      },
      include: { rounds: { orderBy: { startsAt: 'asc' } } },
    });

    this.contestTasksEvents.emit(id, {
      type: STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED,
      deliveryTimeoutMinutes: competition.deliveryTimeoutEnabled
        ? competition.deliveryTimeoutMinutes
        : null,
      balloonLimit: competition.balloonLimitEnabled
        ? competition.balloonLimit
        : null,
    });

    return this.toResponse(competition);
  }

  async createRound(competitionId: string, dto: CreateRoundDto) {
    await getCompetitionOrThrow(competitionId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    try {
      const round = await prisma.$transaction(async (tx) => {
        await assertRoundsDoNotOverlap(tx, competitionId, { startsAt, endsAt });
        return this.createRoundInTx(tx, competitionId, dto);
      });

      this.emitRoundSchedule(competitionId, round);
      return toRoundResponse(round);
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new BadRequestException(
          'O horário desta rodada se sobrepõe a outra rodada da competição.',
        );
      }

      throw error;
    }
  }

  async updateRound(
    competitionId: string,
    roundId: string,
    dto: UpdateRoundDto,
  ) {
    const existing = await this.getRoundInCompetition(competitionId, roundId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    try {
      const round = await prisma.$transaction(async (tx) => {
        await assertRoundsDoNotOverlap(tx, competitionId, { startsAt, endsAt }, roundId);

        return tx.contest.update({
          where: { id: roundId },
          data: {
            name: dto.name,
            startsAt,
            endsAt,
          },
        });
      });

      const scheduleChanged =
        existing.startsAt.getTime() !== startsAt.getTime() ||
        existing.endsAt.getTime() !== endsAt.getTime() ||
        existing.name !== dto.name;

      if (scheduleChanged) {
        this.emitRoundSchedule(competitionId, round);
      }

      return toRoundResponse(round);
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new BadRequestException(
          'O horário desta rodada se sobrepõe a outra rodada da competição.',
        );
      }

      throw error;
    }
  }

  async deleteRound(competitionId: string, roundId: string) {
    await this.getRoundInCompetition(competitionId, roundId);

    const roundCount = await prisma.contest.count({
      where: { competitionId },
    });

    if (roundCount <= 1) {
      throw new BadRequestException(
        'A competição precisa ter pelo menos uma rodada.',
      );
    }

    await prisma.contest.delete({ where: { id: roundId } });

    this.contestAccessEvents.emit(competitionId, {
      type: CONTEST_ACCESS_EVENT_TYPE.ROUND_CHANGED,
      contestId: competitionId,
      roundId: null,
      roundName: null,
      startsAt: null,
      endsAt: null,
    });

    return { success: true as const };
  }

  private async createRoundInTx(
    tx: Prisma.TransactionClient,
    competitionId: string,
    dto: CreateRoundDto,
  ) {
    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await tx.contest.create({
          data: {
            id: generateShortId(),
            competitionId,
            name: dto.name,
            startsAt: new Date(dto.startsAt),
            endsAt: new Date(dto.endsAt),
          },
        });
      } catch (error) {
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

  private async getRoundInCompetition(competitionId: string, roundId: string) {
    const round = await prisma.contest.findFirst({
      where: { id: roundId, competitionId },
    });

    if (!round) {
      throw new NotFoundException('Rodada não encontrada nesta competição.');
    }

    return round;
  }

  private assertIncomingRoundsDoNotOverlap(
    rounds: Array<{ name: string; startsAt: string; endsAt: string }>,
  ) {
    for (let i = 0; i < rounds.length; i++) {
      for (let j = i + 1; j < rounds.length; j++) {
        const a = rounds[i]!;
        const b = rounds[j]!;
        if (
          roundsOverlap(
            { id: String(i), name: a.name, startsAt: a.startsAt, endsAt: a.endsAt },
            { id: String(j), name: b.name, startsAt: b.startsAt, endsAt: b.endsAt },
          )
        ) {
          throw new BadRequestException(
            'O horário desta rodada se sobrepõe a outra rodada da competição.',
          );
        }
      }
    }
  }

  private emitRoundSchedule(competitionId: string, round: Contest) {
    this.contestAccessEvents.emit(competitionId, {
      type: CONTEST_ACCESS_EVENT_TYPE.SCHEDULE_UPDATED,
      contestId: competitionId,
      name: round.name,
      startsAt: round.startsAt.toISOString(),
      endsAt: round.endsAt.toISOString(),
      roundId: round.id,
      roundName: round.name,
    });
    this.contestAccessEvents.emit(competitionId, {
      type: CONTEST_ACCESS_EVENT_TYPE.ROUND_CHANGED,
      contestId: competitionId,
      roundId: round.id,
      roundName: round.name,
      startsAt: round.startsAt.toISOString(),
      endsAt: round.endsAt.toISOString(),
    });
  }

  private toStatus(status: ContestStatusDto): ContestStatus {
    return status === 'active' ? ContestStatus.ACTIVE : ContestStatus.INACTIVE;
  }

  private toStatusDto(status: ContestStatus): ContestStatusDto {
    return status === ContestStatus.ACTIVE ? 'active' : 'inactive';
  }

  private toResponse(
    competition: Competition & { rounds: Contest[] },
  ) {
    const schedule = getCompetitionSchedule(competition.rounds);

    return {
      id: competition.id,
      name: competition.name,
      status: this.toStatusDto(competition.status),
      venue: competition.venue,
      balloonLimitEnabled: competition.balloonLimitEnabled,
      balloonLimit: competition.balloonLimit,
      deliveryTimeoutEnabled: competition.deliveryTimeoutEnabled,
      deliveryTimeoutMinutes: competition.deliveryTimeoutMinutes,
      rounds: competition.rounds.map((round) => toRoundResponse(round)),
      currentRound: schedule.currentRound
        ? toRoundResponse(schedule.currentRound)
        : null,
      nextRound: schedule.nextRound
        ? toRoundResponse(schedule.nextRound)
        : null,
      condition: schedule.condition,
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
    };
  }
}
