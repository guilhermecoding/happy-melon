import {
  normalizeChefError,
  parseChefError,
} from './chef.error';
import type {
  Chef,
  CreateChefInput,
  CreatedChef,
  DeleteChefInput,
  ResetChefPasswordInput,
  UpdateChefInput,
} from './chef.type';

import { getApiBaseUrl } from '@/lib/api-url';

function chefsUrl(contestId: string, suffix = '') {
  return `${getApiBaseUrl()}/competitions/${contestId}/chefs${suffix}`;
}

export const chefService = {
  async list(contestId: string): Promise<Chef[]> {
    try {
      const response = await fetch(chefsUrl(contestId), {
        credentials: 'include',
      });

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível carregar os chefes.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(error, 'Não foi possível carregar os chefes.');
    }
  },

  async create(
    contestId: string,
    data: CreateChefInput,
  ): Promise<CreatedChef> {
    try {
      const response = await fetch(chefsUrl(contestId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível criar o chefe.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(error, 'Não foi possível criar o chefe.');
    }
  },

  async update(
    contestId: string,
    id: string,
    data: UpdateChefInput,
  ): Promise<Chef> {
    try {
      const response = await fetch(chefsUrl(contestId, `/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível atualizar o chefe.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(error, 'Não foi possível atualizar o chefe.');
    }
  },

  async setAccess(
    contestId: string,
    id: string,
    hasAccess: boolean,
  ): Promise<Chef> {
    try {
      const response = await fetch(chefsUrl(contestId, `/${id}/access`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasAccess }),
      });

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível atualizar o acesso do chefe.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(
        error,
        'Não foi possível atualizar o acesso do chefe.',
      );
    }
  },

  async remove(
    contestId: string,
    id: string,
    data: DeleteChefInput,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(chefsUrl(contestId, `/${id}/delete`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível excluir o chefe.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(error, 'Não foi possível excluir o chefe.');
    }
  },

  async resetPassword(
    contestId: string,
    id: string,
    data: ResetChefPasswordInput,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(
        chefsUrl(contestId, `/${id}/reset-password`),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseChefError(
          response,
          'Não foi possível redefinir a senha do chefe.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeChefError(
        error,
        'Não foi possível redefinir a senha do chefe.',
      );
    }
  },
};
