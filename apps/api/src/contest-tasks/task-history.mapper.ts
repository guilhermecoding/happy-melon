import { BalloonDeliveryStatus as PrismaBalloonDeliveryStatus } from '@repo/database';
import {
  BALLOON_DELIVERY_STATUS,
  type BalloonDeliveryStatus,
  type TaskHistoryEntryDto,
} from '@repo/shared';

function toStatusDto(
  status: PrismaBalloonDeliveryStatus,
): BalloonDeliveryStatus {
  switch (status) {
    case PrismaBalloonDeliveryStatus.PENDING:
      return BALLOON_DELIVERY_STATUS.PENDING;
    case PrismaBalloonDeliveryStatus.PROCESSING:
      return BALLOON_DELIVERY_STATUS.PROCESSING;
    case PrismaBalloonDeliveryStatus.DELIVERED:
      return BALLOON_DELIVERY_STATUS.DELIVERED;
    case PrismaBalloonDeliveryStatus.WITHHELD:
      return BALLOON_DELIVERY_STATUS.WITHHELD;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function toTaskHistoryEntryDto(entry: {
  id: string;
  contestId: string;
  kind: string;
  type: string;
  status: PrismaBalloonDeliveryStatus;
  message: string;
  teamId: string | null;
  questionId: string | null;
  balloonDeliveryId: string | null;
  printTaskId: string | null;
  relatedTaskId?: string | null;
  actorUserId: string;
  actorName: string;
  createdAt: Date;
}): TaskHistoryEntryDto {
  const taskId =
    entry.relatedTaskId ?? entry.printTaskId ?? entry.balloonDeliveryId;

  return {
    id: entry.id,
    contestId: entry.contestId,
    kind: entry.kind,
    type: entry.type,
    status: toStatusDto(entry.status),
    message: entry.message,
    teamId: entry.teamId,
    questionId: entry.questionId,
    balloonDeliveryId: entry.balloonDeliveryId,
    printTaskId: entry.printTaskId,
    taskId,
    actorUserId: entry.actorUserId,
    actorName: entry.actorName,
    createdAt: entry.createdAt.toISOString(),
  };
}
