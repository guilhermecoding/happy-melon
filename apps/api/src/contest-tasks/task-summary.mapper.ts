import type { BalloonDeliveryStatus as PrismaBalloonDeliveryStatus } from '@repo/database';
import {
  TASK_KIND,
  type TaskSummaryDto,
} from '@repo/shared';
import { toBalloonDeliveryStatusDto } from './staff-task.mapper.js';

type BalloonSummaryFields = {
  id: string;
  contestId: string;
  status: PrismaBalloonDeliveryStatus;
  updatedAt: Date;
  isFirst: boolean;
  teamName: string;
  teamUsername: string;
  questionLabel: string;
  balloonColor: string;
  balloonColorLabel: string;
  responsibleName: string | null;
};

type PrintSummaryFields = {
  id: string;
  contestId: string;
  status: PrismaBalloonDeliveryStatus;
  updatedAt: Date;
  teamName: string;
  teamUsername: string;
  responsibleName: string | null;
};

export function toBalloonTaskSummary(
  input: BalloonSummaryFields,
): TaskSummaryDto {
  return {
    id: input.id,
    kind: TASK_KIND.BALLOON_TASK,
    contestId: input.contestId,
    status: toBalloonDeliveryStatusDto(input.status),
    updatedAt: input.updatedAt.toISOString(),
    teamName: input.teamName,
    teamUsername: input.teamUsername,
    questionLabel: input.questionLabel,
    balloonColor: input.balloonColor,
    balloonColorLabel: input.balloonColorLabel,
    isFirst: input.isFirst,
    responsibleName: input.responsibleName,
  };
}

export function toPrintTaskSummary(input: PrintSummaryFields): TaskSummaryDto {
  return {
    id: input.id,
    kind: TASK_KIND.PRINT_TASK,
    contestId: input.contestId,
    status: toBalloonDeliveryStatusDto(input.status),
    updatedAt: input.updatedAt.toISOString(),
    teamName: input.teamName,
    teamUsername: input.teamUsername,
    questionLabel: null,
    balloonColor: null,
    balloonColorLabel: null,
    isFirst: false,
    responsibleName: input.responsibleName,
  };
}
