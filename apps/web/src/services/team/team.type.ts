import type { TeamSnapshot } from '@repo/shared';

export type Team = TeamSnapshot;

export type CreateTeamInput = {
  name: string;
  usernameTeam: string;
  room?: string | null;
  machine?: string | null;
};

export type UpdateTeamInput = CreateTeamInput;

export type UpdateTeamPlacementInput = {
  room: string | null;
  machine: string | null;
  updatedAt: string;
};

export type DeleteTeamInput = {
  password: string;
};

export type BulkUpsertTeamsInput = {
  teams: CreateTeamInput[];
};

export function isTeam(value: unknown): value is Team {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const team = value as Record<string, unknown>;
  return (
    typeof team.id === 'string' &&
    typeof team.competitionId === 'string' &&
    typeof team.name === 'string' &&
    typeof team.usernameTeam === 'string' &&
    (team.room === null || typeof team.room === 'string') &&
    (team.machine === null || typeof team.machine === 'string') &&
    typeof team.createdAt === 'string' &&
    typeof team.updatedAt === 'string'
  );
}
