import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  type Prisma,
} from '@repo/database';

export const LOBBY_CAPACITY_ERROR_MESSAGE =
  'Você já está com o máximo de tarefas no lobby.';

function advisoryLockKeys(competitionId: string, userId: string): [number, number] {
  const digest = createHash('sha256')
    .update(`${competitionId}:${userId}`)
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
    const round = await tx.contest.findUnique({
      where: { id: contestId },
      select: {
        competitionId: true,
        competition: {
          select: {
            balloonLimitEnabled: true,
            balloonLimit: true,
          },
        },
      },
    });

    const competition = round?.competition;
    if (!round || !competition?.balloonLimitEnabled || competition.balloonLimit == null) {
      return;
    }

    const competitionId = round.competitionId;
    const [key1, key2] = advisoryLockKeys(competitionId, userId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key1}, ${key2})`;

    const processing = PrismaBalloonDeliveryStatus.PROCESSING;
    const [balloonCount, printCount] = await Promise.all([
      tx.balloonDelivery.count({
        where: {
          contest: { competitionId },
          claimedByUserId: userId,
          status: processing,
        },
      }),
      tx.printTask.count({
        where: {
          contest: { competitionId },
          claimedByUserId: userId,
          status: processing,
        },
      }),
    ]);

    if (balloonCount + printCount >= competition.balloonLimit) {
      throw new BadRequestException(LOBBY_CAPACITY_ERROR_MESSAGE);
    }
  }
}
