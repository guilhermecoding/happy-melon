export const CONTEST_ACCESS_EVENT_TYPE = {
  COLLABORATORS_DISABLED: 'contest.collaboratorsAccess.disabled',
  COLLABORATOR_REVOKED: 'contest.collaboratorAccess.revoked',
  SCHEDULE_UPDATED: 'contest.schedule.updated',
  ROUND_CHANGED: 'contest.round.changed',
} as const;

export type ContestAccessEventType =
  (typeof CONTEST_ACCESS_EVENT_TYPE)[keyof typeof CONTEST_ACCESS_EVENT_TYPE];

export type ContestCollaboratorsAccessDisabledEvent = {
  type: typeof CONTEST_ACCESS_EVENT_TYPE.COLLABORATORS_DISABLED;
  contestId: string;
};

export type ContestCollaboratorAccessRevokedEvent = {
  type: typeof CONTEST_ACCESS_EVENT_TYPE.COLLABORATOR_REVOKED;
  contestId: string;
  userId: string;
};

export type ContestScheduleUpdatedEvent = {
  type: typeof CONTEST_ACCESS_EVENT_TYPE.SCHEDULE_UPDATED;
  contestId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  roundId: string;
  roundName: string;
};

export type ContestRoundChangedEvent = {
  type: typeof CONTEST_ACCESS_EVENT_TYPE.ROUND_CHANGED;
  contestId: string;
  roundId: string | null;
  roundName: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type ContestAccessEvent =
  | ContestCollaboratorsAccessDisabledEvent
  | ContestCollaboratorAccessRevokedEvent
  | ContestScheduleUpdatedEvent
  | ContestRoundChangedEvent;
