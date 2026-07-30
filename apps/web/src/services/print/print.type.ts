import type { BalloonDeliveryStatus } from '@repo/shared';

export type PrintTask = {
  id: string;
  contestId: string;
  teamId: string;
  status: BalloonDeliveryStatus;
  claimedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnqueuePrintTaskInput = {
  teamId: string;
};
