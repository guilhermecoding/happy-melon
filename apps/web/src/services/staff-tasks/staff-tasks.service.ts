import {
  TASK_KIND,
  type StaffTask,
  type StaffTaskEvent,
  type StaffTasksSnapshot,
} from '@repo/shared';
import { getApiBaseUrl } from '@/lib/api-url';
import {
  BalloonServiceError,
  normalizeBalloonError,
  parseBalloonError,
} from '@/services/balloon/balloon.error';
import {
  PrintServiceError,
  normalizePrintError,
  parsePrintError,
} from '@/services/print/print.error';

const API_URL = getApiBaseUrl();

export const CLAIM_RACE_ERROR_MESSAGE =
  'Ops! Alguém foi ligeiro e já pegou essa task. Tente outra!';

export const CLAIM_SUCCESS_MESSAGE =
  'Agora é com você! Tarefa adicionada ao seu lobby.';

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

export const staffTasksService = {
  async getSnapshot(contestId: string): Promise<StaffTasksSnapshot> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(
        `${API_URL}/contests/${contestId}/staff-tasks`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível carregar as tarefas.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível carregar as tarefas.',
      );
    }
  },

  getEventsUrl(contestId: string): string {
    return `${API_URL}/contests/${contestId}/tasks/events`;
  },

  parseEventData(raw: string): StaffTaskEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'type' in parsed &&
        'task' in parsed
      ) {
        return parsed as StaffTaskEvent;
      }
      return null;
    } catch {
      return null;
    }
  },

  async claim(contestId: string, task: StaffTask): Promise<StaffTask> {
    if (task.kind === TASK_KIND.PRINT_TASK) {
      try {
        const response = await fetch(
          `${API_URL}/contests/${contestId}/print-tasks/${task.id}/claim`,
          {
            method: 'POST',
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw await parsePrintError(
            response,
            'Não foi possível pegar a tarefa.',
          );
        }

        return response.json();
      } catch (error) {
        throw normalizePrintError(
          error,
          'Não foi possível pegar a tarefa.',
        );
      }
    }

    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/balloon-deliveries/${task.id}/claim`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível pegar a tarefa.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível pegar a tarefa.',
      );
    }
  },

  isClaimRaceError(error: unknown): boolean {
    if (
      error instanceof PrintServiceError ||
      error instanceof BalloonServiceError
    ) {
      return error.status === 400;
    }

    return false;
  },

  getClaimErrorMessage(error: unknown): string {
    if (this.isClaimRaceError(error)) {
      return CLAIM_RACE_ERROR_MESSAGE;
    }

    if (
      error instanceof PrintServiceError ||
      error instanceof BalloonServiceError
    ) {
      return error.message;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Não foi possível pegar a tarefa.';
  },
};
