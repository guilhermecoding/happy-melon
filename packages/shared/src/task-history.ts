import type { BalloonDeliveryStatus, TaskKind, TaskType } from './balloon-delivery.js';

export const TASK_HISTORY_EVENT_TYPE = {
  CREATED: 'task.history.created',
} as const;

export type TaskHistoryEventType =
  (typeof TASK_HISTORY_EVENT_TYPE)[keyof typeof TASK_HISTORY_EVENT_TYPE];

export type TaskHistoryEntryDto = {
  id: string;
  contestId: string;
  kind: TaskKind | string;
  type: TaskType | string;
  status: BalloonDeliveryStatus;
  message: string;
  teamId: string | null;
  questionId: string | null;
  balloonDeliveryId: string | null;
  printTaskId: string | null;
  taskId: string | null;
  actorUserId: string;
  actorName: string;
  createdAt: string;
};

export type TaskHistoryCreatedEvent = {
  type: typeof TASK_HISTORY_EVENT_TYPE.CREATED;
  entry: TaskHistoryEntryDto;
};
