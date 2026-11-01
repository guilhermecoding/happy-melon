export const TEAM_PLACEMENT_MAX_LENGTH = 120;

export const TEAM_EVENT_TYPE = {
  UPSERTED: 'team.upserted',
  REMOVED: 'team.removed',
} as const;

export type TeamEventType =
  (typeof TEAM_EVENT_TYPE)[keyof typeof TEAM_EVENT_TYPE];

export type TeamSnapshot = {
  id: string;
  competitionId: string;
  name: string;
  usernameTeam: string;
  room: string | null;
  machine: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamUpsertedEvent = {
  type: typeof TEAM_EVENT_TYPE.UPSERTED;
  team: TeamSnapshot;
};

export type TeamRemovedEvent = {
  type: typeof TEAM_EVENT_TYPE.REMOVED;
  teamId: string;
};

export type TeamEvent = TeamUpsertedEvent | TeamRemovedEvent;
