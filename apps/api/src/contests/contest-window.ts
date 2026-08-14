import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';

export async function assertContestInProgress(contestId: string) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { startsAt: true, endsAt: true },
  });

  if (!contest) {
    throw new NotFoundException('Competição não encontrada.');
  }

  const now = new Date();

  if (now < contest.startsAt) {
    throw new ForbiddenException('A competição ainda não começou.');
  }

  if (now >= contest.endsAt) {
    throw new ForbiddenException('A competição já finalizou.');
  }
}
