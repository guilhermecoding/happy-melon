export type CompetitionCondition =
  | 'not_started'
  | 'in_progress'
  | 'intermission'
  | 'finished';

export type RoundWindow = {
  id: string;
  name: string;
  startsAt: string | Date;
  endsAt: string | Date;
};

export type CompetitionSchedule<T extends RoundWindow = RoundWindow> = {
  condition: CompetitionCondition;
  currentRound: T | null;
  nextRound: T | null;
  firstRound: T | null;
  lastRound: T | null;
};

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function sortRoundsByStart<T extends RoundWindow>(rounds: T[]): T[] {
  return [...rounds].sort((a, b) => toTime(a.startsAt) - toTime(b.startsAt));
}

export function roundsOverlap(a: RoundWindow, b: RoundWindow): boolean {
  return toTime(a.startsAt) < toTime(b.endsAt) && toTime(b.startsAt) < toTime(a.endsAt);
}

export function getCompetitionSchedule<T extends RoundWindow>(
  rounds: T[],
  now: Date = new Date(),
): CompetitionSchedule<T> {
  const sorted = sortRoundsByStart(rounds);
  const nowMs = now.getTime();
  const firstRound = sorted[0] ?? null;
  const lastRound = sorted[sorted.length - 1] ?? null;

  if (!firstRound || !lastRound) {
    return {
      condition: 'finished',
      currentRound: null,
      nextRound: null,
      firstRound: null,
      lastRound: null,
    };
  }

  const currentRound =
    sorted.find((round) => {
      const start = toTime(round.startsAt);
      const end = toTime(round.endsAt);
      return start <= nowMs && nowMs < end;
    }) ?? null;

  if (currentRound) {
    return {
      condition: 'in_progress',
      currentRound,
      nextRound: null,
      firstRound,
      lastRound,
    };
  }

  if (nowMs < toTime(firstRound.startsAt)) {
    return {
      condition: 'not_started',
      currentRound: null,
      nextRound: firstRound,
      firstRound,
      lastRound,
    };
  }

  if (nowMs >= toTime(lastRound.endsAt)) {
    return {
      condition: 'finished',
      currentRound: null,
      nextRound: null,
      firstRound,
      lastRound,
    };
  }

  const nextRound =
    sorted.find((round) => toTime(round.startsAt) > nowMs) ?? null;

  return {
    condition: 'intermission',
    currentRound: null,
    nextRound,
    firstRound,
    lastRound,
  };
}
