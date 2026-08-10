import {
  BALLOON_DELIVERY_STATUS,
  TASK_KIND,
  type BalloonDeliveryStatus,
  type StaffTask,
} from '@repo/shared';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
} from '@repo/database';

export function toBalloonDeliveryStatusDto(
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

export function toBalloonStaffTask(params: {
  id: string;
  contestId: string;
  teamId: string;
  teamName: string;
  questionId: string;
  balloonColor: string;
  questionLabel: string;
  status: PrismaBalloonDeliveryStatus;
  claimedByUserId: string | null;
  createdAt: Date;
}): StaffTask {
  return {
    id: params.id,
    kind: TASK_KIND.BALLOON_TASK,
    contestId: params.contestId,
    teamId: params.teamId,
    teamName: params.teamName,
    status: toBalloonDeliveryStatusDto(params.status),
    claimedByUserId: params.claimedByUserId,
    createdAt: params.createdAt.toISOString(),
    questionId: params.questionId,
    balloonColor: params.balloonColor,
    questionLabel: params.questionLabel,
  };
}

export function toPrintStaffTask(params: {
  id: string;
  contestId: string;
  teamId: string;
  teamName: string;
  status: PrismaBalloonDeliveryStatus;
  claimedByUserId: string | null;
  createdAt: Date;
}): StaffTask {
  return {
    id: params.id,
    kind: TASK_KIND.PRINT_TASK,
    contestId: params.contestId,
    teamId: params.teamId,
    teamName: params.teamName,
    status: toBalloonDeliveryStatusDto(params.status),
    claimedByUserId: params.claimedByUserId,
    createdAt: params.createdAt.toISOString(),
  };
}
