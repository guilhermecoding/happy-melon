import {
  normalizeCollaboratorError,
  parseCollaboratorError,
} from './collaborator.error';
import type {
  Collaborator,
  CreateCollaboratorInput,
  UpdateCollaboratorInput,
} from './collaborator.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const collaboratorService = {
  async list(contestId: string): Promise<Collaborator[]> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/collaborators`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível carregar os colaboradores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível carregar os colaboradores.',
      );
    }
  },

  async create(
    contestId: string,
    data: CreateCollaboratorInput,
  ): Promise<Collaborator> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/collaborators`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível criar o colaborador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível criar o colaborador.',
      );
    }
  },

  async update(
    contestId: string,
    userId: string,
    data: UpdateCollaboratorInput,
  ): Promise<Collaborator> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/collaborators/${userId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível atualizar o colaborador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível atualizar o colaborador.',
      );
    }
  },

  async setAccess(
    contestId: string,
    userId: string,
    hasAccess: boolean,
  ): Promise<Collaborator> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/collaborators/${userId}/access`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasAccess }),
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível atualizar o acesso do colaborador.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível atualizar o acesso do colaborador.',
      );
    }
  },

  async remove(
    contestId: string,
    userId: string,
  ): Promise<{ success: true }> {
    try {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/collaborators/${userId}/delete`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível excluir o colaborador.',
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível excluir o colaborador.',
      );
    }
  },
};
