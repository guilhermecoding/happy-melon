import { Injectable } from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
} from '@repo/database';
import {
  getCompetitionSchedule,
  type StaffTask,
  type StaffTasksSnapshot,
} from '@repo/shared';
import { getCompetitionOrThrow } from '../competitions/round-access.js';
import {
  teamFieldsFrom,
  toBalloonStaffTask,
  toPrintStaffTask,
} from './staff-task.mapper.js';

@Injectable()
export class ContestTasksService {
  async getCompetitionStaffTasksSnapshot(
    competitionId: string,
    userId: string,
  ): Promise<StaffTasksSnapshot> {
    const competition = await getCompetitionOrThrow(competitionId);
    const rounds = await prisma.contest.findMany({
      where: { competitionId },
      orderBy: { startsAt: 'asc' },
    });
    const schedule = getCompetitionSchedule(rounds);

    return this.buildSnapshot({
      queueContestId: schedule.currentRound?.id ?? null,
      mineCompetitionId: competitionId,
      userId,
      balloonLimitEnabled: competition.balloonLimitEnabled,
      balloonLimit: competition.balloonLimit,
      deliveryTimeoutEnabled: competition.deliveryTimeoutEnabled,
      deliveryTimeoutMinutes: competition.deliveryTimeoutMinutes,
    });
  }

  private async buildSnapshot(params: {
    queueContestId: string | null;
    mineCompetitionId: string;
    userId: string;
    balloonLimitEnabled: boolean;
    balloonLimit: number | null;
    deliveryTimeoutEnabled: boolean;
    deliveryTimeoutMinutes: number | null;
  }): Promise<StaffTasksSnapshot> {
    const processing = PrismaBalloonDeliveryStatus.PROCESSING;
    const pending = PrismaBalloonDeliveryStatus.PENDING;

    const [balloonQueue, printQueue, balloonMine, printMine] =
      await Promise.all([
        params.queueContestId
          ? prisma.balloonDelivery.findMany({
              where: {
                contestId: params.queueContestId,
                status: pending,
                claimedByUserId: null,
              },
              include: { team: true, question: true },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        params.queueContestId
          ? prisma.printTask.findMany({
              where: {
                contestId: params.queueContestId,
                status: pending,
                claimedByUserId: null,
              },
              include: { team: true },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        prisma.balloonDelivery.findMany({
          where: {
            contest: { competitionId: params.mineCompetitionId },
            status: processing,
            claimedByUserId: params.userId,
          },
          include: { team: true, question: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.printTask.findMany({
          where: {
            contest: { competitionId: params.mineCompetitionId },
            status: processing,
            claimedByUserId: params.userId,
          },
          include: { team: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const queue = this.sortByCreatedAt([
      ...balloonQueue.map((delivery) =>
        toBalloonStaffTask({
          id: delivery.id,
          contestId: delivery.contestId,
          teamId: delivery.teamId,
          ...teamFieldsFrom(delivery.team),
          questionId: delivery.questionId,
          balloonColor: delivery.question.balloonColor,
          questionLabel: delivery.question.label,
          status: delivery.status,
          claimedByUserId: delivery.claimedByUserId,
          claimedAt: delivery.claimedAt,
          createdAt: delivery.createdAt,
        }),
      ),
      ...printQueue.map((task) =>
        toPrintStaffTask({
          id: task.id,
          contestId: task.contestId,
          teamId: task.teamId,
          ...teamFieldsFrom(task.team),
          status: task.status,
          claimedByUserId: task.claimedByUserId,
          claimedAt: task.claimedAt,
          createdAt: task.createdAt,
        }),
      ),
    ]);

    const mine = this.sortByCreatedAt([
      ...balloonMine.map((delivery) =>
        toBalloonStaffTask({
          id: delivery.id,
          contestId: delivery.contestId,
          teamId: delivery.teamId,
          ...teamFieldsFrom(delivery.team),
          questionId: delivery.questionId,
          balloonColor: delivery.question.balloonColor,
          questionLabel: delivery.question.label,
          status: delivery.status,
          claimedByUserId: delivery.claimedByUserId,
          claimedAt: delivery.claimedAt,
          createdAt: delivery.createdAt,
        }),
      ),
      ...printMine.map((task) =>
        toPrintStaffTask({
          id: task.id,
          contestId: task.contestId,
          teamId: task.teamId,
          ...teamFieldsFrom(task.team),
          status: task.status,
          claimedByUserId: task.claimedByUserId,
          claimedAt: task.claimedAt,
          createdAt: task.createdAt,
        }),
      ),
    ]);

    return {
      queue,
      mine,
      deliveryTimeoutMinutes: params.deliveryTimeoutEnabled
        ? params.deliveryTimeoutMinutes
        : null,
      balloonLimit: params.balloonLimitEnabled ? params.balloonLimit : null,
      currentRoundId: params.queueContestId,
    };
  }

  private sortByCreatedAt(tasks: StaffTask[]): StaffTask[] {
    return [...tasks].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
}
