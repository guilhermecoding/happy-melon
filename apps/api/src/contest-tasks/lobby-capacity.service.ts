import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  type Prisma,
} from '@repo/database';

export const LOBBY_CAPACITY_ERROR_MESSAGE =
  'Você já está com o máximo de tarefas no lobby.';

function advisoryLockKeys(contestId: string, userId: string): [number, number] {
  const digest = createHash('sha256')
    .update(`${contestId}:${userId}`)
    .digest();

  return [digest.readInt32BE(0), digest.readInt32BE(4)];
}

@Injectable()
export class LobbyCapacityService {
  async assertCanClaim(
    tx: Prisma.TransactionClient,
    contestId: string,
    userId: string,
  ) {
    const contest = await tx.contest.findUnique({
      where: { id: contestId },
      select: {
        balloonLimitEnabled: true,
        balloonLimit: true,
      },
    });

    if (!contest?.balloonLimitEnabled || contest.balloonLimit == null) {
      return;
    }

    const [key1, key2] = advisoryLockKeys(contestId, userId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key1}, ${key2})`;

    const processing = PrismaBalloonDeliveryStatus.PROCESSING;
    const [balloonCount, printCount] = await Promise.all([
      tx.balloonDelivery.count({
        where: {
          contestId,
          claimedByUserId: userId,
          status: processing,
        },
      }),
      tx.printTask.count({
        where: {
          contestId,
          claimedByUserId: userId,
          status: processing,
        },
      }),
    ]);

    if (balloonCount + printCount >= contest.balloonLimit) {
      throw new BadRequestException(LOBBY_CAPACITY_ERROR_MESSAGE);
    }
  }
}
