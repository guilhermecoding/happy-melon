export class CollaboratorServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'CollaboratorServiceError';
  }
}

export async function parseCollaboratorError(
  response: Response,
  fallback: string,
): Promise<CollaboratorServiceError> {
  const rawMessage = await readResponseMessage(response);
  return new CollaboratorServiceError(
    response.status,
    mapCollaboratorErrorMessage(response.status, rawMessage, fallback),
  );
}

export function normalizeCollaboratorError(
  error: unknown,
  fallback: string,
): CollaboratorServiceError {
  if (error instanceof CollaboratorServiceError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new CollaboratorServiceError(
      null,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new CollaboratorServiceError(null, error.message);
  }

  return new CollaboratorServiceError(null, fallback);
}

export function getCollaboratorErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return normalizeCollaboratorError(error, fallback).message;
}

function mapCollaboratorErrorMessage(
  status: number,
  rawMessage: string,
  fallback: string,
): string {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (
    status === 409 ||
    /already exists|user.?exists|email.?already|unique constraint|duplicate|já está vinculado|pertence a um administrador/i.test(
      message,
    )
  ) {
    return message || 'Já existe um usuário com este e-mail.';
  }

  if (status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (status === 403) {
    return message || 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return message || 'Colaborador não encontrado.';
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
