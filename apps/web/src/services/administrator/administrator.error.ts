export class AdministratorServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'AdministratorServiceError';
  }
}

export async function parseAdministratorError(
  response: Response,
  fallback: string,
): Promise<AdministratorServiceError> {
  const rawMessage = await readResponseMessage(response);
  return new AdministratorServiceError(
    response.status,
    mapAdministratorErrorMessage(response.status, rawMessage, fallback),
  );
}

export function normalizeAdministratorError(
  error: unknown,
  fallback: string,
): AdministratorServiceError {
  if (error instanceof AdministratorServiceError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new AdministratorServiceError(
      null,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new AdministratorServiceError(null, error.message);
  }

  return new AdministratorServiceError(null, fallback);
}

export function getAdministratorErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return normalizeAdministratorError(error, fallback).message;
}

function mapAdministratorErrorMessage(
  status: number,
  rawMessage: string,
  fallback: string,
): string {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (
    status === 409 ||
    /already exists|user.?exists|email.?already|unique constraint|duplicate/i.test(
      message,
    )
  ) {
    return 'Já existe um usuário com este e-mail.';
  }

  if (status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (status === 403) {
    return message || 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return 'Administrador não encontrado.';
  }

  if (status === 400 || status === 422) {
    if (/email/i.test(normalized) && /invalid|inválid/i.test(normalized)) {
      return 'Informe um e-mail válido.';
    }
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
