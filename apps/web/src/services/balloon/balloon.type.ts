import type {
  BalloonDeliveryStatus,
  TaskKind,
  TaskType,
} from '@repo/shared';

export type BalloonDelivery = {
  id: string;
  contestId: string;
  teamId: string;
  questionId: string;
  status: BalloonDeliveryStatus;
  claimedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskHistoryEntry = {
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

export type TeamQuestionActionInput = {
  teamId: string;
  questionId: string;
};
