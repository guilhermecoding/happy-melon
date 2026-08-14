import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
  type Prisma,
} from '@repo/database';
import {
  BALLOON_DELIVERY_STATUS,
  STAFF_TASK_EVENT_TYPE,
  TASK_HISTORY_EVENT_TYPE,
  TASK_KIND,
  taskTypeFromStatus,
} from '@repo/shared';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import {
  teamFieldsFrom,
  toBalloonStaffTask,
  toPrintStaffTask,
} from './staff-task.mapper.js';
import { TaskHistoryEventsService } from './task-history.events.js';
import { toTaskHistoryEntryDto } from './task-history.mapper.js';

const SWEEP_INTERVAL_MS = 15_000;

type BalloonWithRelations = Prisma.BalloonDeliveryGetPayload<{
  include: { team: true; question: true };
}>;

type PrintWithRelations = Prisma.PrintTaskGetPayload<{
  include: { team: true };
}>;

@Injectable()
export class DeliveryTimeoutService {
  private readonly logger = new Logger(DeliveryTimeoutService.name);
  private running = false;

  constructor(
    private readonly contestTasksEvents: ContestTasksEventsService,
    private readonly taskHistoryEvents: TaskHistoryEventsService,
  ) {}

  @Interval(SWEEP_INTERVAL_MS)
  async expireOverdueTasks() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      await this.expire();
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : 'Falha no sweep de timeout.',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }

  private async expire() {
    const contests = await prisma.contest.findMany({
      where: {
        deliveryTimeoutEnabled: true,
        deliveryTimeoutMinutes: { not: null },
      },
      select: {
        id: true,
        deliveryTimeoutMinutes: true,
      },
    });

    if (contests.length === 0) {
      return;
    }

    const contestIdsByMinutes = new Map<number, string[]>();

    for (const contest of contests) {
      const minutes = contest.deliveryTimeoutMinutes;
      if (minutes == null) continue;

      const ids = contestIdsByMinutes.get(minutes) ?? [];
      ids.push(contest.id);
      contestIdsByMinutes.set(minutes, ids);
    }

    const processing = PrismaBalloonDeliveryStatus.PROCESSING;
    const pending = PrismaBalloonDeliveryStatus.PENDING;
    const now = Date.now();

    for (const [minutes, contestIds] of contestIdsByMinutes) {
      const cutoff = new Date(now - minutes * 60_000);

      const [balloons, prints] = await Promise.all([
        prisma.balloonDelivery.findMany({
          where: {
            contestId: { in: contestIds },
            status: processing,
            claimedAt: { lte: cutoff },
          },
          include: { team: true, question: true },
        }),
        prisma.printTask.findMany({
          where: {
            contestId: { in: contestIds },
            status: processing,
            claimedAt: { lte: cutoff },
          },
          include: { team: true },
        }),
      ]);

      if (balloons.length === 0 && prints.length === 0) {
        continue;
      }

      const actorNames = await this.loadActorNames([
        ...balloons.map((delivery) => delivery.claimedByUserId),
        ...prints.map((task) => task.claimedByUserId),
      ]);

      for (const delivery of balloons) {
        await this.expireBalloon(delivery, actorNames, pending, processing);
      }

      for (const task of prints) {
        await this.expirePrint(task, actorNames, pending, processing);
      }
    }
  }

  private async expireBalloon(
    delivery: BalloonWithRelations,
    actorNames: Map<string, string>,
    pending: PrismaBalloonDeliveryStatus,
    processing: PrismaBalloonDeliveryStatus,
  ) {
    const actorUserId = delivery.claimedByUserId;
    if (!actorUserId) {
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.balloonDelivery.updateMany({
        where: {
          id: delivery.id,
          contestId: delivery.contestId,
          status: processing,
        },
        data: {
          status: pending,
          claimedByUserId: null,
          claimedAt: null,
        },
      });

      if (updated.count !== 1) {
        return null;
      }

      const saved = await tx.balloonDelivery.findFirstOrThrow({
        where: { id: delivery.id, contestId: delivery.contestId },
        include: { team: true, question: true },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId: saved.contestId,
        kind: TASK_KIND.BALLOON_TASK,
        status: saved.status,
        message: 'Tempo esgotado. Balão voltou para a fila.',
        teamId: saved.teamId,
        questionId: saved.questionId,
        balloonDeliveryId: saved.id,
        printTaskId: null,
        relatedTaskId: saved.id,
        actorUserId,
        actorName: actorNames.get(actorUserId) ?? 'Staff',
      });

      return { saved, history };
    });

    if (!result) {
      return;
    }

    this.contestTasksEvents.emit(result.saved.contestId, {
      type: STAFF_TASK_EVENT_TYPE.QUEUED,
      task: toBalloonStaffTask({
        id: result.saved.id,
        contestId: result.saved.contestId,
        teamId: result.saved.teamId,
        ...teamFieldsFrom(result.saved.team),
        questionId: result.saved.questionId,
        balloonColor: result.saved.question.balloonColor,
        questionLabel: result.saved.question.label,
        status: result.saved.status,
        claimedByUserId: result.saved.claimedByUserId,
        claimedAt: result.saved.claimedAt,
        createdAt: result.saved.createdAt,
      }),
    });

    this.taskHistoryEvents.emit(result.saved.contestId, {
      type: TASK_HISTORY_EVENT_TYPE.CREATED,
      entry: toTaskHistoryEntryDto(result.history),
    });
  }

  private async expirePrint(
    task: PrintWithRelations,
    actorNames: Map<string, string>,
    pending: PrismaBalloonDeliveryStatus,
    processing: PrismaBalloonDeliveryStatus,
  ) {
    const actorUserId = task.claimedByUserId;
    if (!actorUserId) {
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.printTask.updateMany({
        where: {
          id: task.id,
          contestId: task.contestId,
          status: processing,
        },
        data: {
          status: pending,
          claimedByUserId: null,
          claimedAt: null,
        },
      });

      if (updated.count !== 1) {
        return null;
      }

      const saved = await tx.printTask.findFirstOrThrow({
        where: { id: task.id, contestId: task.contestId },
        include: { team: true },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId: saved.contestId,
        kind: TASK_KIND.PRINT_TASK,
        status: saved.status,
        message: 'Tempo esgotado. Impressão voltou para a fila.',
        teamId: saved.teamId,
        questionId: null,
        balloonDeliveryId: null,
        printTaskId: saved.id,
        relatedTaskId: saved.id,
        actorUserId,
        actorName: actorNames.get(actorUserId) ?? 'Staff',
      });

      return { saved, history };
    });

    if (!result) {
      return;
    }

    this.contestTasksEvents.emit(result.saved.contestId, {
      type: STAFF_TASK_EVENT_TYPE.QUEUED,
      task: toPrintStaffTask({
        id: result.saved.id,
        contestId: result.saved.contestId,
        teamId: result.saved.teamId,
        ...teamFieldsFrom(result.saved.team),
        status: result.saved.status,
        claimedByUserId: result.saved.claimedByUserId,
        claimedAt: result.saved.claimedAt,
        createdAt: result.saved.createdAt,
      }),
    });

    this.taskHistoryEvents.emit(result.saved.contestId, {
      type: TASK_HISTORY_EVENT_TYPE.CREATED,
      entry: toTaskHistoryEntryDto(result.history),
    });
  }

  private async loadActorNames(
    userIds: Array<string | null>,
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true },
    });

    return new Map(users.map((user) => [user.id, user.name]));
  }

  private async createHistoryEntry(
    tx: Prisma.TransactionClient,
    params: {
      contestId: string;
      kind: typeof TASK_KIND.BALLOON_TASK | typeof TASK_KIND.PRINT_TASK;
      status: PrismaBalloonDeliveryStatus;
      message: string;
      teamId: string;
      questionId: string | null;
      balloonDeliveryId: string | null;
      printTaskId: string | null;
      relatedTaskId: string;
      actorUserId: string;
      actorName: string;
    },
  ) {
    const type = taskTypeFromStatus(
      BALLOON_DELIVERY_STATUS.PENDING,
      params.kind,
    );

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await tx.taskHistory.create({
          data: {
            id: generateShortId(),
            contestId: params.contestId,
            kind: params.kind,
            type,
            status: params.status,
            message: params.message,
            teamId: params.teamId,
            questionId: params.questionId,
            balloonDeliveryId: params.balloonDeliveryId,
            printTaskId: params.printTaskId,
            relatedTaskId: params.relatedTaskId,
            actorUserId: params.actorUserId,
            actorName: params.actorName,
          },
        });
      } catch (error) {
        if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }
}
