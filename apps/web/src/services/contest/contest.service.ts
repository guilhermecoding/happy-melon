import {
  normalizeContestError,
  parseContestError,
} from './contest.error';
import type { Contest, CreateContestInput } from './contest.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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
