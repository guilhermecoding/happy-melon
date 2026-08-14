import type {
  BalloonDeliveryStatus,
  TaskHistoryEntryDto,
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

export type TaskHistoryEntry = TaskHistoryEntryDto;

export type TeamQuestionActionInput = {
  teamId: string;
  questionId: string;
};

// Keep TaskKind/TaskType re-exports available for local imports if needed.
export type { TaskKind, TaskType };
