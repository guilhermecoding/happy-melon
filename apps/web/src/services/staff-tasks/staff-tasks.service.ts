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

export const CLAIM_RACE_ERROR_MESSAGE =
  'Ops! Alguém foi ligeiro e já pegou essa task. Tente outra!';

export const MULTI_TOUCH_BAN_ERROR_MESSAGE =
  'Você está temporariamente impedido de pegar tarefas.';

export const CLAIM_SUCCESS_MESSAGES = [
  'Agora é com você! Tarefa adicionada ao seu lobby.',
  'Pegou! Essa tarefa já está no seu lobby.',
  'Boa! Mais uma missão acabou de cair no lobby.',
  'É sua! Leva essa pro lobby e mostra serviço.',
  'Capturada! A tarefa já está esperando no lobby.',
  'Fechou! Seu lobby acabou de ganhar companhia.',
  'Missão aceita! Tarefa adicionada ao lobby.',
  'Olha só! Essa já é sua e está no lobby.',
  'Mandou bem! Tarefa conquistada e no lobby.',
  'Chegou! Essa tarefa agora mora no seu lobby.',
] as const;

export const DELIVER_SUCCESS_MESSAGES = [
  'Que massa! Você arrasou nessa tarefa do início ao fim!',
  'Entregue! Você voou nessa do começo ao fim.',
  'Pronto! Missão cumprida com chave de ouro.',
  'Uhu! Tarefa entregue. Continua nesse ritmo!',
  'Arrasou de novo! Essa entrega saiu redondinha.',
  'Feito! Mais uma tarefa resolvida com maestria.',
  'Isso aí! Tarefa entregue e lobby mais leve.',
  'Mandou muito! Você fechou essa com estilo.',
  'Show! Entrega confirmada, pode comemorar.',
  'Brilhou! Essa tarefa foi sua do início ao fim.',
] as const;

function pickMessage(messages: readonly string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]!;
}

export function getClaimSuccessMessage(): string {
  return pickMessage(CLAIM_SUCCESS_MESSAGES);
}

export function getDeliverSuccessMessage(): string {
  return pickMessage(DELIVER_SUCCESS_MESSAGES);
}

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
        `${getApiBaseUrl()}/competitions/${contestId}/staff-tasks`,
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
    return `${getApiBaseUrl()}/competitions/${contestId}/tasks/events`;
  },

  async reportMultiTouch(
    contestId: string,
  ): Promise<{ bannedUntil: string | null }> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/competitions/${contestId}/staff-tasks/multi-touch`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseBalloonError(
          response,
          'Não foi possível aplicar o bloqueio.',
        );
      }

      const body: unknown = await response.json();
      if (!body || typeof body !== 'object' || !('bannedUntil' in body)) {
        throw new Error('Não foi possível aplicar o bloqueio.');
      }

      const bannedUntil = (body as { bannedUntil: unknown }).bannedUntil;
      if (bannedUntil !== null && typeof bannedUntil !== 'string') {
        throw new Error('Não foi possível aplicar o bloqueio.');
      }

      return { bannedUntil };
    } catch (error) {
      throw normalizeBalloonError(
        error,
        'Não foi possível aplicar o bloqueio.',
      );
    }
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
        const multiTouchBanEnabled = (
          parsed as { multiTouchBanEnabled?: unknown }
        ).multiTouchBanEnabled;
        if (minutes !== null && typeof minutes !== 'number') {
          return null;
        }
        if (balloonLimit !== null && typeof balloonLimit !== 'number') {
          return null;
        }
        if (typeof multiTouchBanEnabled !== 'boolean') {
          return null;
        }
        return {
          type: STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED,
          deliveryTimeoutMinutes: minutes,
          balloonLimit,
          multiTouchBanEnabled,
        };
      }

      if (type === STAFF_TASK_EVENT_TYPE.MULTI_TOUCH_RESTRICTED) {
        const restrictedUserId = (parsed as { userId?: unknown }).userId;
        const bannedUntil = (parsed as { bannedUntil?: unknown }).bannedUntil;
        if (typeof restrictedUserId !== 'string' || restrictedUserId === '') {
          return null;
        }
        if (typeof bannedUntil !== 'string' || bannedUntil === '') {
          return null;
        }
        return {
          type: STAFF_TASK_EVENT_TYPE.MULTI_TOUCH_RESTRICTED,
          userId: restrictedUserId,
          bannedUntil,
        };
      }

      if (
        (type === STAFF_TASK_EVENT_TYPE.QUEUED ||
          type === STAFF_TASK_EVENT_TYPE.REMOVED) &&
        'task' in parsed
      ) {
        return parsed as StaffTaskEvent;
      }

      if (type === STAFF_TASK_EVENT_TYPE.CLAIMED && 'task' in parsed) {
        const claimedByName = (parsed as { claimedByName?: unknown })
          .claimedByName;
        if (typeof claimedByName !== 'string' || claimedByName.trim() === '') {
          return null;
        }
        return parsed as StaffTaskEvent;
      }

      return null;
    } catch {
      return null;
    }
  },

  async claim(_competitionId: string, task: StaffTask): Promise<StaffTask> {
    const contestId = task.contestId;
    if (task.kind === TASK_KIND.PRINT_TASK) {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/contests/${contestId}/print-tasks/${task.id}/claim`,
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
        `${getApiBaseUrl()}/contests/${contestId}/balloon-deliveries/${task.id}/claim`,
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

  async deliver(_competitionId: string, task: StaffTask): Promise<StaffTask> {
    const contestId = task.contestId;
    if (task.kind === TASK_KIND.PRINT_TASK) {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/contests/${contestId}/print-tasks/${task.id}/deliver`,
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
        `${getApiBaseUrl()}/contests/${contestId}/balloon-deliveries/${task.id}/deliver`,
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

  isMultiTouchBanError(error: unknown): boolean {
    if (
      error instanceof PrintServiceError ||
      error instanceof BalloonServiceError
    ) {
      return (
        error.status === 400 && error.message === MULTI_TOUCH_BAN_ERROR_MESSAGE
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
