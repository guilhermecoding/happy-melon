import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ContestStatus, prisma, type Contest } from '@repo/database';
import { CONTEST_ACCESS_EVENT_TYPE } from '@repo/shared';
import { revokeStaffSessionsForContest } from '../auth/staff-session-access.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ContestAccessEventsService } from './contest-access.events.js';
import type {
  ContestStatusDto,
  CreateContestDto,
  StaffSettingsDto,
  UpdateContestDto,
} from './dto/contest.dto.js';

@Injectable()
export class ContestsService {
  constructor(
    private readonly contestAccessEvents: ContestAccessEventsService,
  ) {}

  async list() {
    const contests = await prisma.contest.findMany({
      orderBy: { startsAt: 'desc' },
    });

    return contests.map((contest) => this.toResponse(contest));
  }

  async findById(id: string) {
    const contest = await prisma.contest.findUnique({ where: { id } });

    if (!contest) {
      throw new NotFoundException('Competição não encontrada.');
    }

    return this.toResponse(contest);
  }

  async create(dto: CreateContestDto) {
    const { startsAt, endsAt, status } = this.parseContestDatesAndStatus(dto);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const contest = await prisma.contest.create({
          data: {
            id: generateShortId(),
            name: dto.name,
            status,
            startsAt,
            endsAt,
            venue: dto.venue,
          },
        });

        return this.toResponse(contest);
      } catch (error) {
        if (
          attempt < ID_MAX_ATTEMPTS - 1 &&
          isIdUniqueViolation(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  async update(id: string, dto: UpdateContestDto) {
    const existing = await prisma.contest.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Competição não encontrada.');
    }

    const { startsAt, endsAt, status } = this.parseContestDatesAndStatus(dto);

    const contest = await prisma.contest.update({
      where: { id },
      data: {
        name: dto.name,
        status,
        startsAt,
        endsAt,
        venue: dto.venue,
      },
    });

    // Collaborator access off → end sessions and notify open staff clients.
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

    return this.toResponse(contest);
  }

  async updateStaffSettings(id: string, dto: StaffSettingsDto) {
    const existing = await prisma.contest.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Competição não encontrada.');
    }

    const contest = await prisma.contest.update({
      where: { id },
      data: {
        balloonLimitEnabled: dto.balloonLimitEnabled,
        balloonLimit: dto.balloonLimitEnabled ? dto.balloonLimit : null,
        deliveryTimeoutEnabled: dto.deliveryTimeoutEnabled,
        deliveryTimeoutMinutes: dto.deliveryTimeoutEnabled
          ? dto.deliveryTimeoutMinutes
          : null,
      },
    });

    return this.toResponse(contest);
  }

  private parseContestDatesAndStatus(dto: CreateContestDto | UpdateContestDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Datas inválidas.');
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'A data de término deve ser posterior à data de início.',
      );
    }

    const status =
      dto.status === 'active' ? ContestStatus.ACTIVE : ContestStatus.INACTIVE;

    return { startsAt, endsAt, status };
  }

  private toResponse(contest: Contest) {
    return {
      id: contest.id,
      name: contest.name,
      status: this.toStatusDto(contest.status),
      startsAt: contest.startsAt.toISOString(),
      endsAt: contest.endsAt.toISOString(),
      venue: contest.venue,
      balloonLimitEnabled: contest.balloonLimitEnabled,
      balloonLimit: contest.balloonLimit,
      deliveryTimeoutEnabled: contest.deliveryTimeoutEnabled,
      deliveryTimeoutMinutes: contest.deliveryTimeoutMinutes,
    };
  }

  private toStatusDto(status: ContestStatus): ContestStatusDto {
    return status === ContestStatus.ACTIVE ? 'active' : 'inactive';
  }
}
