import {
  TASK_HISTORY_EVENT_TYPE,
  type TaskHistoryCreatedEvent,
} from '@repo/shared';
import {
  normalizeBalloonError,
  parseBalloonError,
} from './balloon.error';
import type {
  BalloonDelivery,
  TaskHistoryEntry,
  TeamQuestionActionInput,
} from './balloon.type';

import { getApiBaseUrl } from '@/lib/api-url';

const API_URL = getApiBaseUrl();

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

export const balloonService = {
  async listDeliveries(
    contestId: string,
    teamId?: string,
  ): Promise<BalloonDelivery[]> {
    try {
      const cookie = await getServerCookieHeader();
      const search = teamId
        ? `?${new URLSearchParams({ teamId }).toString()}`
        : '';
      const response = await fetch(
        `${API_URL}/contests/${contestId}/balloon-deliveries${search}`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível carregar os balões.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível carregar os balões.',
      );
    }
  },

  async listTaskHistory(contestId: string): Promise<TaskHistoryEntry[]> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(
        `${API_URL}/contests/${contestId}/task-history`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível carregar o histórico.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível carregar o histórico.',
      );
    }
  },

  getTaskHistoryEventsUrl(contestId: string): string {
    return `${API_URL}/contests/${contestId}/task-history/events`;
  },

  parseTaskHistoryEventData(raw: string): TaskHistoryCreatedEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'type' in parsed &&
        parsed.type === TASK_HISTORY_EVENT_TYPE.CREATED &&
        'entry' in parsed
      ) {
        return parsed as TaskHistoryCreatedEvent;
      }
      return null;
    } catch {
      return null;
    }
  },

  async listTaskTimeline(
    contestId: string,
    relatedTaskId: string,
    kind?: string,
  ): Promise<TaskHistoryEntry[]> {
    try {
      const cookie = await getServerCookieHeader();
      const search = kind
        ? `?${new URLSearchParams({ kind }).toString()}`
        : '';
      const response = await fetch(
        `${API_URL}/contests/${contestId}/task-history/by-task/${relatedTaskId}${search}`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível carregar o histórico da tarefa.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível carregar o histórico da tarefa.',
      );
    }
  },

  async confirm(
    contestId: string,
    data: TeamQuestionActionInput,
  ): Promise<BalloonDelivery> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/balloon-deliveries/confirm`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível confirmar o balão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível confirmar o balão.',
      );
    }
  },

  async withhold(
    contestId: string,
    data: TeamQuestionActionInput,
  ): Promise<BalloonDelivery> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/balloon-deliveries/withhold`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível reter o balão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível reter o balão.',
      );
    }
  },
};
