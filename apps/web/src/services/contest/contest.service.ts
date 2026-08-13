import {
  normalizeContestError,
  parseContestError,
} from './contest.error';
import type {
  Contest,
  CreateContestInput,
  StaffSettingsInput,
  UpdateContestInput,
} from './contest.type';

import {
  CONTEST_ACCESS_EVENT_TYPE,
  type ContestAccessEvent,
} from '@repo/shared';
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

export const contestService = {
  async list(): Promise<Contest[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/contests`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível carregar as competições.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível carregar as competições.',
      );
    }
  },

  async get(id: string): Promise<Contest> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(`${getApiBaseUrl()}/contests/${id}`, {
        credentials: 'include',
        headers: cookie ? { cookie } : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível carregar a competição.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível carregar a competição.',
      );
    }
  },

  async create(data: CreateContestInput): Promise<Contest> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/contests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível criar a competição.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível criar a competição.',
      );
    }
  },

  async update(id: string, data: UpdateContestInput): Promise<Contest> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/contests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível atualizar a competição.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível atualizar a competição.',
      );
    }
  },

  async updateStaffSettings(
    id: string,
    data: StaffSettingsInput,
  ): Promise<Contest> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/contests/${id}/staff-settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível atualizar os ajustes.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível atualizar os ajustes.',
      );
    }
  },

  getAccessEventsUrl(contestId: string): string {
    return `${getApiBaseUrl()}/contests/${contestId}/access/events`;
  },

  parseAccessEventData(raw: string): ContestAccessEvent | null {
    try {
      const parsed = JSON.parse(raw) as ContestAccessEvent;
      if (
        parsed?.type === CONTEST_ACCESS_EVENT_TYPE.COLLABORATORS_DISABLED ||
        parsed?.type === CONTEST_ACCESS_EVENT_TYPE.COLLABORATOR_REVOKED
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },
};
