import {
  STAFF_TASK_EVENT_TYPE,
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

export const DELIVER_SUCCESS_MESSAGE = 'Que massa! Você arrasou nessa tarefa do início ao fim!';

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

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error instanceof PrintServiceError ||
    error instanceof BalloonServiceError
  ) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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
      if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
        return null;
      }

      const type = (parsed as { type: unknown }).type;

      if (type === STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED) {
        const minutes = (parsed as { deliveryTimeoutMinutes?: unknown })
          .deliveryTimeoutMinutes;
        const balloonLimit = (parsed as { balloonLimit?: unknown })
          .balloonLimit;
        if (minutes !== null && typeof minutes !== 'number') {
          return null;
        }
        if (balloonLimit !== null && typeof balloonLimit !== 'number') {
          return null;
        }
        return {
          type: STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED,
          deliveryTimeoutMinutes: minutes,
          balloonLimit,
        };
      }

      if (
        (type === STAFF_TASK_EVENT_TYPE.QUEUED ||
          type === STAFF_TASK_EVENT_TYPE.CLAIMED ||
          type === STAFF_TASK_EVENT_TYPE.REMOVED) &&
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

  async deliver(contestId: string, task: StaffTask): Promise<StaffTask> {
    if (task.kind === TASK_KIND.PRINT_TASK) {
      try {
        const response = await fetch(
          `${API_URL}/contests/${contestId}/print-tasks/${task.id}/deliver`,
          {
            method: 'POST',
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw await parsePrintError(
            response,
            'Não foi possível marcar a tarefa como entregue.',
          );
        }

        return response.json();
      } catch (error) {
        throw normalizePrintError(
          error,
          'Não foi possível marcar a tarefa como entregue.',
        );
      }
    }

    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/balloon-deliveries/${task.id}/deliver`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível marcar a tarefa como entregue.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível marcar a tarefa como entregue.',
      );
    }
  },

  isClaimRaceError(error: unknown): boolean {
    if (
      error instanceof PrintServiceError ||
      error instanceof BalloonServiceError
    ) {
      return (
        error.status === 400 && error.message === CLAIM_RACE_ERROR_MESSAGE
      );
    }

    return false;
  },

  getClaimErrorMessage(error: unknown): string {
    if (this.isClaimRaceError(error)) {
      return CLAIM_RACE_ERROR_MESSAGE;
    }

    return getErrorMessage(error, 'Não foi possível pegar a tarefa.');
  },

  getDeliverErrorMessage(error: unknown): string {
    return getErrorMessage(
      error,
      'Não foi possível marcar a tarefa como entregue.',
    );
  },
};
