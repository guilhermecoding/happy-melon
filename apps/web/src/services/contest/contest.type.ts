export type ContestStatus = 'active' | 'inactive';

export type ContestCondition = 'not_started' | 'in_progress' | 'finished';

export type Contest = {
  id: string;
  name: string;
  status: ContestStatus;
  startsAt: string;
  endsAt: string;
  venue: string;
};

export type CreateContestInput = {
  name: string;
  status: ContestStatus;
  startsAt: string;
  endsAt: string;
  venue: string;
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

  if (now > end) {
    return 'finished';
  }

  return 'in_progress';
}
