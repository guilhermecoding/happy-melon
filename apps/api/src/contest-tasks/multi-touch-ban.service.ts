import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma, type Prisma } from '@repo/database';
import { STAFF_TASK_EVENT_TYPE } from '@repo/shared';
import { getCompetitionOrThrow } from '../competitions/round-access.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';

export const MULTI_TOUCH_BAN_ERROR_MESSAGE =
  'Você está temporariamente impedido de pegar tarefas.';

type ReportResult = {
  bannedUntil: Date;
  renewed: boolean;
};

@Injectable()
export class MultiTouchBanService {
  constructor(private readonly contestTasksEvents: ContestTasksEventsService) {}

  async report(
    competitionId: string,
    userId: string,
  ): Promise<{ bannedUntil: string | null }> {
    await getCompetitionOrThrow(competitionId);

    const result = await prisma.$transaction((tx) =>
      this.restrictInTransaction(tx, competitionId, userId),
    );

    if (!result) {
      return { bannedUntil: null };
    }

    if (result.renewed) {
      this.contestTasksEvents.emit(competitionId, {
        type: STAFF_TASK_EVENT_TYPE.MULTI_TOUCH_RESTRICTED,
        userId,
        bannedUntil: result.bannedUntil.toISOString(),
      });
    }

    return { bannedUntil: result.bannedUntil.toISOString() };
  }

  async assertCanClaim(
    tx: Prisma.TransactionClient,
    contestId: string,
    userId: string,
  ) {
    const round = await tx.contest.findUnique({
      where: { id: contestId },
      select: {
        competitionId: true,
        competition: {
          select: {
            multiTouchBanEnabled: true,
          },
        },
      },
    });

    if (!round?.competition.multiTouchBanEnabled) {
      return;
    }

    const ban = await tx.staffMultiTouchBan.findUnique({
      where: {
        competitionId_userId: {
          competitionId: round.competitionId,
          userId,
        },
      },
    });

    if (ban && ban.bannedUntil.getTime() > Date.now()) {
      throw new BadRequestException(MULTI_TOUCH_BAN_ERROR_MESSAGE);
    }
  }

  async findActiveBannedUntil(
    competitionId: string,
    userId: string,
    enabled: boolean,
  ): Promise<string | null> {
    if (!enabled) {
      return null;
    }

    const ban = await prisma.staffMultiTouchBan.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    if (!ban || ban.bannedUntil.getTime() <= Date.now()) {
      return null;
    }

    return ban.bannedUntil.toISOString();
  }

  async clearCompetition(competitionId: string) {
    await prisma.staffMultiTouchBan.deleteMany({
      where: { competitionId },
    });
  }

  private async restrictInTransaction(
    tx: Prisma.TransactionClient,
    competitionId: string,
    userId: string,
  ): Promise<ReportResult | null> {
    const competition = await tx.competition.findUnique({
      where: { id: competitionId },
      select: {
        multiTouchBanEnabled: true,
        multiTouchBanSeconds: true,
      },
    });

    if (
      !competition?.multiTouchBanEnabled ||
      competition.multiTouchBanSeconds == null
    ) {
      return null;
    }

    const now = new Date();
    const existing = await tx.staffMultiTouchBan.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    if (existing && existing.bannedUntil.getTime() > now.getTime()) {
      return { bannedUntil: existing.bannedUntil, renewed: false };
    }

    const bannedUntil = new Date(
      now.getTime() + competition.multiTouchBanSeconds * 1000,
    );

    const saved = await tx.staffMultiTouchBan.upsert({
      where: {
        competitionId_userId: { competitionId, userId },
      },
      create: {
        competitionId,
        userId,
        bannedUntil,
      },
      update: { bannedUntil },
    });

    return { bannedUntil: saved.bannedUntil, renewed: true };
  }
}
