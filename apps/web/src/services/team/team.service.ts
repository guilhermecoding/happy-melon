import {
  TEAM_EVENT_TYPE,
  type TeamEvent,
} from '@repo/shared';
import {
  normalizeTeamError,
  parseTeamError,
} from './team.error';
import {
  isTeam,
  type BulkUpsertTeamsInput,
  type CreateTeamInput,
  type DeleteTeamInput,
  type Team,
  type UpdateTeamInput,
  type UpdateTeamPlacementInput,
} from './team.type';

import { getApiBaseUrl } from '@/lib/api-url';

async function getServerCookieHeader(): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    return undefined;
  }

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  return cookieHeader || undefined;
}

export const teamService = {
  async list(contestId: string): Promise<Team[]> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(`${getApiBaseUrl()}/competitions/${contestId}/teams`, {
        credentials: 'include',
        headers: cookie ? { cookie } : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível carregar os competidores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível carregar os competidores.',
      );
    }
  },

  async create(contestId: string, data: CreateTeamInput): Promise<Team> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/competitions/${contestId}/teams`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível criar o competidor.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(error, 'Não foi possível criar o competidor.');
    }
  },

  async bulkUpsert(
    contestId: string,
    data: BulkUpsertTeamsInput,
  ): Promise<Team[]> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/competitions/${contestId}/teams/bulk`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível importar os competidores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível importar os competidores.',
      );
    }
  },

  async update(id: string, data: UpdateTeamInput): Promise<Team> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/teams/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível atualizar o competidor.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível atualizar o competidor.',
      );
    }
  },

  async updatePlacement(
    contestId: string,
    teamId: string,
    data: UpdateTeamPlacementInput,
  ): Promise<Team> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/competitions/${contestId}/teams/${teamId}/placement`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível atualizar o competidor.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível atualizar o competidor.',
      );
    }
  },

  getEventsUrl(contestId: string): string {
    return `${getApiBaseUrl()}/competitions/${contestId}/teams/events`;
  },

  parseEventData(raw: string): TeamEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
        return null;
      }

      const record = parsed as {
        type?: unknown;
        team?: unknown;
        teamId?: unknown;
      };

      if (record.type === TEAM_EVENT_TYPE.UPSERTED && isTeam(record.team)) {
        return { type: TEAM_EVENT_TYPE.UPSERTED, team: record.team };
      }

      if (
        record.type === TEAM_EVENT_TYPE.REMOVED &&
        typeof record.teamId === 'string'
      ) {
        return { type: TEAM_EVENT_TYPE.REMOVED, teamId: record.teamId };
      }

      return null;
    } catch {
      return null;
    }
  },

  async remove(
    id: string,
    data: DeleteTeamInput,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/teams/${id}/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível excluir o competidor.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível excluir o competidor.',
      );
    }
  },

  async removeAll(
    contestId: string,
    data: DeleteTeamInput,
  ): Promise<{ success: true; deletedCount: number }> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/competitions/${contestId}/teams/delete`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível excluir os competidores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível excluir os competidores.',
      );
    }
  },
};

export function applyTeamEvent(teams: Team[], event: TeamEvent): Team[] {
  if (event.type === TEAM_EVENT_TYPE.REMOVED) {
    return teams.filter((team) => team.id !== event.teamId);
  }

  const exists = teams.some((team) => team.id === event.team.id);
  if (!exists) {
    return [...teams, event.team];
  }

  return teams.map((team) =>
    team.id === event.team.id ? event.team : team,
  );
}
