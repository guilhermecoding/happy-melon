import {
  normalizeTeamError,
  parseTeamError,
} from './team.error';
import type {
  BulkUpsertTeamsInput,
  CreateTeamInput,
  DeleteTeamInput,
  Team,
  UpdateTeamInput,
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
      const response = await fetch(`${getApiBaseUrl()}/contests/${contestId}/teams`, {
        credentials: 'include',
        headers: cookie ? { cookie } : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível carregar os times.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível carregar os times.',
      );
    }
  },

  async create(contestId: string, data: CreateTeamInput): Promise<Team> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/contests/${contestId}/teams`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseTeamError(
          response,
          'Não foi possível criar o time.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(error, 'Não foi possível criar o time.');
    }
  },

  async bulkUpsert(
    contestId: string,
    data: BulkUpsertTeamsInput,
  ): Promise<Team[]> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/teams/bulk`,
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
          'Não foi possível importar os times.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível importar os times.',
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
          'Não foi possível atualizar o time.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível atualizar o time.',
      );
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
          'Não foi possível excluir o time.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível excluir o time.',
      );
    }
  },

  async removeAll(
    contestId: string,
    data: DeleteTeamInput,
  ): Promise<{ success: true; deletedCount: number }> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/teams/delete`,
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
          'Não foi possível excluir os times.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeTeamError(
        error,
        'Não foi possível excluir os times.',
      );
    }
  },
};
