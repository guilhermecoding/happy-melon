import {
  normalizeAdministratorError,
  parseAdministratorError,
} from './administrator.error';
import type {
  Administrator,
  CreateAdministratorInput,
  CreatedAdministrator,
  DeleteAdministratorInput,
  ResetAdministratorPasswordInput,
  UpdateAdministratorInput,
} from './administrator.type';

import { getApiBaseUrl } from '@/lib/api-url';

const API_URL = getApiBaseUrl();

export const administratorService = {
  async list(): Promise<Administrator[]> {
    try {
      const response = await fetch(`${API_URL}/administrators`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível carregar os administradores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível carregar os administradores.',
      );
    }
  },

  async create(data: CreateAdministratorInput): Promise<CreatedAdministrator> {
    try {
      const response = await fetch(`${API_URL}/administrators`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível criar o administrador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível criar o administrador.',
      );
    }
  },

  async update(
    id: string,
    data: UpdateAdministratorInput,
  ): Promise<Administrator> {
    try {
      const response = await fetch(`${API_URL}/administrators/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível atualizar o administrador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível atualizar o administrador.',
      );
    }
  },

  async setAccess(id: string, hasAccess: boolean): Promise<Administrator> {
    try {
      const response = await fetch(`${API_URL}/administrators/${id}/access`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasAccess }),
      });

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível atualizar o acesso do administrador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível atualizar o acesso do administrador.',
      );
    }
  },

  async remove(
    id: string,
    data: DeleteAdministratorInput,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(`${API_URL}/administrators/${id}/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível excluir o administrador.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível excluir o administrador.',
      );
    }
  },

  async resetPassword(
    id: string,
    data: ResetAdministratorPasswordInput,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(
        `${API_URL}/administrators/${id}/reset-password`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseAdministratorError(
          response,
          'Não foi possível redefinir a senha do administrador.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeAdministratorError(
        error,
        'Não foi possível redefinir a senha do administrador.',
      );
    }
  },
};
