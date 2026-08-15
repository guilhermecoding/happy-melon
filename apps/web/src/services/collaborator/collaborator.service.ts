import {
  COLLABORATOR_EVENT_TYPE,
  type CollaboratorJoinedEvent,
} from '@repo/shared';
import {
  normalizeCollaboratorError,
  parseCollaboratorError,
} from './collaborator.error';
import type {
  Collaborator,
  CollaboratorScore,
  CreateCollaboratorInput,
  UpdateCollaboratorInput,
} from './collaborator.type';

import { getApiBaseUrl } from '@/lib/api-url';

export const collaboratorService = {
  async list(contestId: string): Promise<Collaborator[]> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/collaborators`,
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

  async listScore(contestId: string): Promise<CollaboratorScore[]> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/collaborators/score`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await parseCollaboratorError(
          response,
          'Não foi possível carregar o ranking dos colaboradores.',
        );
      }

      return response.json();
    } catch (error) {
      throw normalizeCollaboratorError(
        error,
        'Não foi possível carregar o ranking dos colaboradores.',
      );
    }
  },

  getEventsUrl(contestId: string): string {
    return `${getApiBaseUrl()}/contests/${contestId}/collaborators/events`;
  },

  parseEventData(raw: string): CollaboratorJoinedEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'type' in parsed &&
        parsed.type === COLLABORATOR_EVENT_TYPE.JOINED &&
        'collaborator' in parsed
      ) {
        return parsed as CollaboratorJoinedEvent;
      }
      return null;
    } catch {
      return null;
    }
  },

  async create(
    contestId: string,
    data: CreateCollaboratorInput,
  ): Promise<Collaborator> {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/contests/${contestId}/collaborators`,
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
        `${getApiBaseUrl()}/contests/${contestId}/collaborators/${userId}`,
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
        `${getApiBaseUrl()}/contests/${contestId}/collaborators/${userId}/access`,
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
        `${getApiBaseUrl()}/contests/${contestId}/collaborators/${userId}/delete`,
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
