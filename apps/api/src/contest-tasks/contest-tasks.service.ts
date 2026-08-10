import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
} from '@repo/database';
import type { StaffTask, StaffTasksSnapshot } from '@repo/shared';
import {
  teamFieldsFrom,
  toBalloonStaffTask,
  toPrintStaffTask,
} from './staff-task.mapper.js';

@Injectable()
export class ContestTasksService {
  async getStaffTasksSnapshot(
    contestId: string,
    userId: string,
  ): Promise<StaffTasksSnapshot> {
    await this.ensureContestExists(contestId);

    const [balloonQueue, printQueue, balloonMine, printMine] =
      await Promise.all([
        prisma.balloonDelivery.findMany({
          where: {
            contestId,
            status: PrismaBalloonDeliveryStatus.PENDING,
            claimedByUserId: null,
          },
          include: { team: true, question: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.printTask.findMany({
          where: {
            contestId,
            status: PrismaBalloonDeliveryStatus.PENDING,
            claimedByUserId: null,
          },
          include: { team: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.balloonDelivery.findMany({
          where: {
            contestId,
            status: PrismaBalloonDeliveryStatus.PROCESSING,
            claimedByUserId: userId,
          },
          include: { team: true, question: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.printTask.findMany({
          where: {
            contestId,
            status: PrismaBalloonDeliveryStatus.PROCESSING,
            claimedByUserId: userId,
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
          createdAt: task.createdAt,
        }),
      ),
    ]);

    return { queue, mine };
  }

  private sortByCreatedAt(tasks: StaffTask[]): StaffTask[] {
    return [...tasks].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
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
}
