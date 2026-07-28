export type Team = {
  id: string;
  contestId: string;
  name: string;
  usernameTeam: string;
  room: string | null;
  machine: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamInput = {
  name: string;
  usernameTeam: string;
  room?: string | null;
  machine?: string | null;
};

export type UpdateTeamInput = CreateTeamInput;

export type BulkUpsertTeamsInput = {
  teams: CreateTeamInput[];
};
