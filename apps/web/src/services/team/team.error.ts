export class TeamServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'TeamServiceError';
  }
}

export async function parseTeamError(
  response: Response,
  fallback: string,
): Promise<TeamServiceError> {
  const rawMessage = await readResponseMessage(response);
  return new TeamServiceError(
    response.status,
    mapTeamErrorMessage(response.status, rawMessage, fallback),
  );
}

export function normalizeTeamError(
  error: unknown,
  fallback: string,
): TeamServiceError {
  if (error instanceof TeamServiceError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new TeamServiceError(
      null,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new TeamServiceError(null, error.message);
  }

  return new TeamServiceError(null, fallback);
}

export function getTeamErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return normalizeTeamError(error, fallback).message;
}

function mapTeamErrorMessage(
  status: number,
  rawMessage: string,
  fallback: string,
): string {
  const message = rawMessage.trim();

  if (status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (status === 403) {
    return message || 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return message || 'Time não encontrado.';
  }

  if (status === 400 || status === 422) {
    return message || 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  if (status >= 500) {
    return 'Erro interno do servidor. Tente novamente em instantes.';
  }

  return message || fallback;
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

      if (
        record.error &&
        typeof record.error === 'object' &&
        record.error !== null &&
        'message' in record.error &&
        typeof (record.error as { message: unknown }).message === 'string'
      ) {
        return (record.error as { message: string }).message;
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  return response.statusText;
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(
      error.message,
    )
  );
}
