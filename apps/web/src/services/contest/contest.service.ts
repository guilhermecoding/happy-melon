import {
  normalizeContestError,
  parseContestError,
} from './contest.error';
import type { Contest, CreateContestInput } from './contest.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export const contestService = {
  async list(): Promise<Contest[]> {
    try {
      const response = await fetch(`${API_URL}/contests`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível carregar as competições.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível carregar as competições.',
      );
    }
  },

  async get(id: string): Promise<Contest> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(`${API_URL}/contests/${id}`, {
        credentials: 'include',
        headers: cookie ? { cookie } : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível carregar a competição.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível carregar a competição.',
      );
    }
  },

  async create(data: CreateContestInput): Promise<Contest> {
    try {
      const response = await fetch(`${API_URL}/contests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseContestError(
          response,
          'Não foi possível criar a competição.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeContestError(
        error,
        'Não foi possível criar a competição.',
      );
    }
  },
};
