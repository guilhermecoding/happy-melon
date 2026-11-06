import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import type { BalloonDeliveryStatus as PrismaBalloonDeliveryStatus } from '@repo/database';
import {
  TASK_SUMMARY_EVENT_TYPE,
  compareTaskSummaries,
  type TaskSummaryDto,
  type TaskSummaryUpdatedEvent,
} from '@repo/shared';
import { Observable } from 'rxjs';
import { getRoundOrThrow } from '../competitions/round-access.js';
import {
  builtinBalloonColorLabel,
  normalizeBalloonHex,
} from '../questions/balloon-color.js';
import { TaskSummaryEventsService } from './task-summary.events.js';
import {
  toBalloonTaskSummary,
  toPrintTaskSummary,
} from './task-summary.mapper.js';

type BalloonPublishInput = {
  id: string;
  contestId: string;
  status: PrismaBalloonDeliveryStatus;
  updatedAt: Date;
  isFirst: boolean;
  claimedByUserId: string | null;
  teamName: string;
  teamUsername: string;
  questionLabel: string;
  balloonColor: string;
  /** When the caller already knows the claimant's name, skip the user lookup. */
  responsibleName?: string;
};

type PrintPublishInput = {
  id: string;
  contestId: string;
  status: PrismaBalloonDeliveryStatus;
  updatedAt: Date;
  claimedByUserId: string | null;
  teamName: string;
  teamUsername: string;
  responsibleName?: string;
};

@Injectable()
export class TaskSummaryService {
  private readonly logger = new Logger(TaskSummaryService.name);

  constructor(private readonly events: TaskSummaryEventsService) {}

  stream(contestId: string): Observable<TaskSummaryUpdatedEvent> {
    return this.events.subscribe(contestId);
  }

  async list(contestId: string): Promise<TaskSummaryDto[]> {
    await getRoundOrThrow(contestId);

    const [balloons, prints] = await Promise.all([
      prisma.balloonDelivery.findMany({
        where: { contestId },
        include: {
          team: { select: { name: true, usernameTeam: true } },
          question: { select: { label: true, balloonColor: true } },
        },
      }),
      prisma.printTask.findMany({
        where: { contestId },
        include: {
          team: { select: { name: true, usernameTeam: true } },
        },
      }),
    ]);

    const userIds = new Set<string>();
    const balloonColors: string[] = [];

    for (const balloon of balloons) {
      if (balloon.claimedByUserId) {
        userIds.add(balloon.claimedByUserId);
      }
      balloonColors.push(balloon.question.balloonColor);
    }

    for (const task of prints) {
      if (task.claimedByUserId) {
        userIds.add(task.claimedByUserId);
      }
    }

    const [names, colorLabels] = await Promise.all([
      this.responsibleNames([...userIds]),
      this.colorLabels(balloonColors),
    ]);

    const summaries: TaskSummaryDto[] = [
      ...balloons.map((balloon) => {
        const color =
          normalizeBalloonHex(balloon.question.balloonColor) ??
          balloon.question.balloonColor;

        return toBalloonTaskSummary({
          id: balloon.id,
          contestId: balloon.contestId,
          status: balloon.status,
          updatedAt: balloon.updatedAt,
          isFirst: balloon.isFirst,
          teamName: balloon.team.name,
          teamUsername: balloon.team.usernameTeam,
          questionLabel: balloon.question.label,
          balloonColor: balloon.question.balloonColor,
          balloonColorLabel: colorLabels.get(color) ?? color,
          responsibleName: balloon.claimedByUserId
            ? (names.get(balloon.claimedByUserId) ?? null)
            : null,
        });
      }),
      ...prints.map((task) =>
        toPrintTaskSummary({
          id: task.id,
          contestId: task.contestId,
          status: task.status,
          updatedAt: task.updatedAt,
          teamName: task.team.name,
          teamUsername: task.team.usernameTeam,
          responsibleName: task.claimedByUserId
            ? (names.get(task.claimedByUserId) ?? null)
            : null,
        }),
      ),
    ];

    summaries.sort(compareTaskSummaries);
    return summaries;
  }

  /**
   * Fan out one balloon row. Failures are logged: the status change is already
   * committed, and a dropped summary is recovered by the client's resync.
   */
  async publishBalloon(input: BalloonPublishInput): Promise<void> {
    try {
      const responsibleName = await this.resolveResponsibleName(
        input.claimedByUserId,
        input.responsibleName,
      );
      const colorLabels = await this.colorLabels([input.balloonColor]);
      const color =
        normalizeBalloonHex(input.balloonColor) ?? input.balloonColor;

      this.events.emit(input.contestId, {
        type: TASK_SUMMARY_EVENT_TYPE.UPDATED,
        task: toBalloonTaskSummary({
          id: input.id,
          contestId: input.contestId,
          status: input.status,
          updatedAt: input.updatedAt,
          isFirst: input.isFirst,
          teamName: input.teamName,
          teamUsername: input.teamUsername,
          questionLabel: input.questionLabel,
          balloonColor: input.balloonColor,
          balloonColorLabel: colorLabels.get(color) ?? color,
          responsibleName,
        }),
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish balloon summary ${input.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async publishPrint(input: PrintPublishInput): Promise<void> {
    try {
      const responsibleName = await this.resolveResponsibleName(
        input.claimedByUserId,
        input.responsibleName,
      );

      this.events.emit(input.contestId, {
        type: TASK_SUMMARY_EVENT_TYPE.UPDATED,
        task: toPrintTaskSummary({
          id: input.id,
          contestId: input.contestId,
          status: input.status,
          updatedAt: input.updatedAt,
          teamName: input.teamName,
          teamUsername: input.teamUsername,
          responsibleName,
        }),
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish print summary ${input.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async resolveResponsibleName(
    userId: string | null,
    knownName?: string,
  ): Promise<string | null> {
    if (!userId) {
      return null;
    }

    if (knownName) {
      return knownName;
    }

    const names = await this.responsibleNames([userId]);
    return names.get(userId) ?? null;
  }

  private async responsibleNames(
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    return new Map(users.map((user) => [user.id, user.name]));
  }

  private async colorLabels(colors: string[]): Promise<Map<string, string>> {
    const labels = new Map<string, string>();
    const customHexes = new Set<string>();

    for (const color of colors) {
      const normalized = normalizeBalloonHex(color) ?? color;
      const builtin = builtinBalloonColorLabel(normalized);
      if (builtin) {
        labels.set(normalized, builtin);
        continue;
      }

      customHexes.add(normalized);
    }

    if (customHexes.size === 0) {
      return labels;
    }

    const presets = await prisma.balloonColorPreset.findMany({
      where: { hex: { in: [...customHexes] } },
      select: { hex: true, name: true },
    });
    const presetNames = new Map(
      presets.map((preset) => [preset.hex, preset.name]),
    );

    for (const hex of customHexes) {
      labels.set(hex, presetNames.get(hex) ?? hex);
    }

    return labels;
  }
}
