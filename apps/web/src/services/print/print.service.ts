import {
  normalizePrintError,
  parsePrintError,
} from './print.error';
import type { EnqueuePrintTaskInput, PrintTask } from './print.type';

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

export const printService = {
  async list(
    contestId: string,
    teamId?: string,
  ): Promise<PrintTask[]> {
    try {
      const cookie = await getServerCookieHeader();
      const search = teamId
        ? `?${new URLSearchParams({ teamId }).toString()}`
        : '';
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/print-tasks${search}`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parsePrintError(
          response,
          'Não foi possível carregar as impressões.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizePrintError(
        error,
        'Não foi possível carregar as impressões.',
      );
    }
  },

  async enqueue(
    contestId: string,
    data: EnqueuePrintTaskInput,
  ): Promise<PrintTask> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/print-tasks/enqueue`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parsePrintError(
          response,
          'Não foi possível encaminhar a impressão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizePrintError(
        error,
        'Não foi possível encaminhar a impressão.',
      );
    }
  },

  async confirm(contestId: string, taskId: string): Promise<PrintTask> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/print-tasks/${taskId}/confirm`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parsePrintError(
          response,
          'Não foi possível confirmar a impressão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizePrintError(
        error,
        'Não foi possível confirmar a impressão.',
      );
    }
  },

  async withhold(contestId: string, taskId: string): Promise<PrintTask> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/print-tasks/${taskId}/withhold`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parsePrintError(
          response,
          'Não foi possível reter a impressão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizePrintError(
        error,
        'Não foi possível reter a impressão.',
      );
    }
  },
};
