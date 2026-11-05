import { getApiBaseUrl } from '@/lib/api-url';

export type CustomBalloonColor = {
  id: string;
  name: string;
  hex: string;
};

export class BalloonColorServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'BalloonColorServiceError';
  }
}

async function readResponseMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (typeof body === 'string') {
      return body;
    }

    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record.message === 'string') {
        return record.message;
      }
      if (Array.isArray(record.message)) {
        return record.message.map(String).join(', ');
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  return response.statusText;
}

async function parseError(
  response: Response,
  fallback: string,
): Promise<BalloonColorServiceError> {
  const message = (await readResponseMessage(response)).trim();
  return new BalloonColorServiceError(response.status, message || fallback);
}

function normalizeError(error: unknown, fallback: string): BalloonColorServiceError {
  if (error instanceof BalloonColorServiceError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new BalloonColorServiceError(
      null,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new BalloonColorServiceError(null, error.message);
  }

  return new BalloonColorServiceError(null, fallback);
}

export function getBalloonColorErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return normalizeError(error, fallback).message;
}

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: string,
): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw await parseError(response, fallback);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw normalizeError(error, fallback);
  }
}

export const balloonColorService = {
  list(): Promise<CustomBalloonColor[]> {
    return request('/balloon-colors', { cache: 'no-store' }, 'Não foi possível carregar as cores.');
  },

  create(data: { name: string; hex: string }): Promise<CustomBalloonColor> {
    return request(
      '/balloon-colors',
      { method: 'POST', body: JSON.stringify(data) },
      'Não foi possível cadastrar a cor.',
    );
  },

  update(
    id: string,
    data: { name: string; hex: string },
  ): Promise<CustomBalloonColor> {
    return request(
      `/balloon-colors/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      'Não foi possível atualizar a cor.',
    );
  },

  remove(id: string): Promise<{ success: true }> {
    return request(
      `/balloon-colors/${id}/delete`,
      { method: 'POST' },
      'Não foi possível excluir a cor.',
    );
  },
};
