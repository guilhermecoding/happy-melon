import { rewriteTeamNoun } from '@/lib/rewrite-team-noun';
import { isTeam, type Team } from './team.type';

export class TeamServiceError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
    public readonly team: Team | null = null,
  ) {
    super(message);
    this.name = 'TeamServiceError';
  }
}

export async function parseTeamError(
  response: Response,
  fallback: string,
): Promise<TeamServiceError> {
  const { message, team } = await readResponseBody(response);
  return new TeamServiceError(
    response.status,
    mapTeamErrorMessage(response.status, message, fallback),
    team,
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
  const message = rewriteTeamNoun(rawMessage.trim());

  if (status === 401) {
    if (/senha|password|incorrect|inválid|invalid/i.test(message)) {
      return message || 'Senha de administrador incorreta.';
    }
    return 'Sessão expirada. Faça login novamente.';
  }

  if (status === 403) {
    return message || 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return message || 'Competidor não encontrado.';
  }

  if (status === 409) {
    return (
      message ||
      'Sala e máquina foram alteradas por outra pessoa. Revise e salve de novo.'
    );
  }

  if (status === 400 || status === 422) {
    return message || 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  if (status >= 500) {
    return 'Erro interno do servidor. Tente novamente em instantes.';
  }

  return message || fallback;
}

async function readResponseBody(response: Response): Promise<{
  message: string;
  team: Team | null;
}> {
  try {
    const body: unknown = await response.json();
    return {
      message: messageFromBody(body) || response.statusText,
      team: teamFromBody(body),
    };
  } catch {
    return { message: response.statusText, team: null };
  }
}

function messageFromBody(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return '';
  }

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

  return '';
}

function teamFromBody(body: unknown): Team | null {
  if (!body || typeof body !== 'object' || !('team' in body)) {
    return null;
  }

  const team = (body as { team: unknown }).team;
  return isTeam(team) ? team : null;
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
