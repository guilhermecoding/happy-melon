import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ContestStatus, prisma, type Contest } from '@repo/database';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import type { ContestStatusDto, CreateContestDto } from './dto/contest.dto.js';

@Injectable()
export class ContestsService {
  async list() {
    const contests = await prisma.contest.findMany({
      orderBy: { startsAt: 'desc' },
    });

    return contests.map((contest) => this.toResponse(contest));
  }

  async create(dto: CreateContestDto) {
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

  private toResponse(contest: Contest) {
    return {
      id: contest.id,
      name: contest.name,
      status: this.toStatusDto(contest.status),
      startsAt: contest.startsAt.toISOString(),
      endsAt: contest.endsAt.toISOString(),
      venue: contest.venue,
    };
  }

  private toStatusDto(status: ContestStatus): ContestStatusDto {
    return status === ContestStatus.ACTIVE ? 'active' : 'inactive';
  }
}
