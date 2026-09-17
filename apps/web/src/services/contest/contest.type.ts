import type { CompetitionCondition } from '@repo/shared';

export type { CompetitionCondition } from '@repo/shared';
export { getCompetitionSchedule, isScoreFreezeActive } from '@repo/shared';

export type ContestCondition = 'not_started' | 'in_progress' | 'finished';

export type ContestRound = {
  id: string;
  competitionId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  scoreFreezeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Contest = {
  id: string;
  name: string;
  venue: string;
  balloonLimitEnabled: boolean;
  balloonLimit: number | null;
  deliveryTimeoutEnabled: boolean;
  deliveryTimeoutMinutes: number | null;
  rounds: ContestRound[];
  currentRound: ContestRound | null;
  nextRound: ContestRound | null;
  condition: CompetitionCondition;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoundInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  scoreFreezeMinutes?: number | null;
};

export type UpdateRoundInput = CreateRoundInput;

export type DeleteRoundInput = {
  password: string;
};

export type CreateContestInput = {
  name: string;
  venue: string;
  rounds: CreateRoundInput[];
};

export type UpdateContestInput = {
  name: string;
  venue: string;
};

export type StaffSettingsInput = {
  balloonLimitEnabled: boolean;
  balloonLimit: number | null;
  deliveryTimeoutEnabled: boolean;
  deliveryTimeoutMinutes: number | null;
};

export function getContestCondition(
  startsAt: string | Date,
  endsAt: string | Date,
  now: Date = new Date(),
): ContestCondition {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);

  if (now < start) {
    return 'not_started';
  }

  if (now >= end) {
    return 'finished';
  }

  return 'in_progress';
}

export function pickRoundId(
  contest: Contest,
  preferredRoundId?: string | null,
): string | null {
  if (
    preferredRoundId &&
    contest.rounds.some((round) => round.id === preferredRoundId)
  ) {
    return preferredRoundId;
  }

  return (
    contest.currentRound?.id ??
    contest.nextRound?.id ??
    contest.rounds[0]?.id ??
    null
  );
}
