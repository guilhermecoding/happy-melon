export class PrintServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'PrintServiceError';
  }
}

export async function parsePrintError(
  response: Response,
  fallback: string,
): Promise<PrintServiceError> {
  const rawMessage = await readResponseMessage(response);
  return new PrintServiceError(
    response.status,
    mapPrintErrorMessage(response.status, rawMessage, fallback),
  );
}

export function normalizePrintError(
  error: unknown,
  fallback: string,
): PrintServiceError {
  if (error instanceof PrintServiceError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new PrintServiceError(
      null,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new PrintServiceError(null, error.message);
  }

  return new PrintServiceError(null, fallback);
}

export function getPrintErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return normalizePrintError(error, fallback).message;
}

function mapPrintErrorMessage(
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
    return message || 'Tarefa de impressão não encontrada.';
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
