import {
  normalizeQuestionError,
  parseQuestionError,
} from './question.error';
import type {
  CreateQuestionInput,
  Question,
  UpdateQuestionInput,
} from './question.type';

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

export const questionService = {
  async list(contestId: string): Promise<Question[]> {
    try {
      const cookie = await getServerCookieHeader();
      const response = await fetch(
        `${API_URL}/contests/${contestId}/questions`,
        {
          credentials: 'include',
          headers: cookie ? { cookie } : undefined,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw await parseQuestionError(
          response,
          'Não foi possível carregar as questões.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeQuestionError(
        error,
        'Não foi possível carregar as questões.',
      );
    }
  },

  async create(
    contestId: string,
    data: CreateQuestionInput,
  ): Promise<Question> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/questions`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseQuestionError(
          response,
          'Não foi possível criar a questão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeQuestionError(
        error,
        'Não foi possível criar a questão.',
      );
    }
  },

  async update(id: string, data: UpdateQuestionInput): Promise<Question> {
    try {
      const response = await fetch(`${API_URL}/questions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseQuestionError(
          response,
          'Não foi possível atualizar a questão.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeQuestionError(
        error,
        'Não foi possível atualizar a questão.',
      );
    }
  },
};
