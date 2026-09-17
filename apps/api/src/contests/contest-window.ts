import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContestStatus, prisma } from '@repo/database';

export async function assertRoundInProgress(contestId: string) {
  const round = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      startsAt: true,
      endsAt: true,
      competition: { select: { status: true } },
    },
  });

  if (!round) {
    throw new NotFoundException('Rodada não encontrada.');
  }

  if (round.competition.status !== ContestStatus.ACTIVE) {
    throw new ForbiddenException(
      'O acesso dos colaboradores está desabilitado para esta competição.',
    );
  }

  const now = new Date();

  if (now < round.startsAt) {
    throw new ForbiddenException('A rodada ainda não começou.');
  }

  if (now >= round.endsAt) {
    throw new ForbiddenException('A rodada já finalizou.');
  }
}

export async function assertCompetitionActiveForRound(contestId: string) {
  const round = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      competition: { select: { status: true } },
    },
  });

  if (!round) {
    throw new NotFoundException('Rodada não encontrada.');
  }

  if (round.competition.status !== ContestStatus.ACTIVE) {
    throw new ForbiddenException(
      'O acesso dos colaboradores está desabilitado para esta competição.',
    );
  }
}

/** @deprecated Use assertRoundInProgress */
export const assertContestInProgress = assertRoundInProgress;
