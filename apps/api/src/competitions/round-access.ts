import { BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma, type Contest, type Prisma } from '@repo/database';
import { roundsOverlap } from '@repo/shared';

export async function getRoundOrThrow(contestId: string) {
  const round = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { competition: true },
  });

  if (!round) {
    throw new NotFoundException('Rodada não encontrada.');
  }

  return round;
}

export async function getCompetitionOrThrow(competitionId: string) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new NotFoundException('Competição não encontrada.');
  }

  return competition;
}

export async function assertRoundsDoNotOverlap(
  tx: Prisma.TransactionClient,
  competitionId: string,
  candidate: { startsAt: Date; endsAt: Date },
  excludeRoundId?: string,
) {
  await tx.$queryRaw`
    SELECT id FROM contest
    WHERE "competitionId" = ${competitionId}
    FOR UPDATE
  `;

  const existing = await tx.contest.findMany({
    where: {
      competitionId,
      ...(excludeRoundId ? { NOT: { id: excludeRoundId } } : {}),
    },
    select: { id: true, name: true, startsAt: true, endsAt: true },
  });

  const overlaps = existing.some((round) =>
    roundsOverlap(
      { id: 'candidate', name: '', startsAt: candidate.startsAt, endsAt: candidate.endsAt },
      round,
    ),
  );

  if (overlaps) {
    throw new BadRequestException(
      'O horário desta rodada se sobrepõe a outra rodada da competição.',
    );
  }
}

export function toRoundResponse(round: Contest) {
  return {
    id: round.id,
    competitionId: round.competitionId,
    name: round.name,
    startsAt: round.startsAt.toISOString(),
    endsAt: round.endsAt.toISOString(),
    scoreFreezeMinutes: round.scoreFreezeMinutes,
    createdAt: round.createdAt.toISOString(),
    updatedAt: round.updatedAt.toISOString(),
  };
}
