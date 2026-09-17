import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';

export async function assertRoundInProgress(contestId: string) {
  const round = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      startsAt: true,
      endsAt: true,
    },
  });

  if (!round) {
    throw new NotFoundException('Rodada não encontrada.');
  }

  const now = new Date();

  if (now < round.startsAt) {
    throw new ForbiddenException('A rodada ainda não começou.');
  }

  if (now >= round.endsAt) {
    throw new ForbiddenException('A rodada já finalizou.');
  }
}

/** @deprecated Use assertRoundInProgress */
export const assertContestInProgress = assertRoundInProgress;
