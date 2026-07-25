import type {
  Administrator,
  CreateAdministratorInput,
  CreatedAdministrator,
  UpdateAdministratorInput,
} from './administrator.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = body.message ?? response.statusText;
    return Array.isArray(message) ? message.join(', ') : String(message);
  } catch {
    return response.statusText;
  }
}

export const administratorService = {
  async list(): Promise<Administrator[]> {
    const response = await fetch(`${API_URL}/administrators`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },

  async create(data: CreateAdministratorInput): Promise<CreatedAdministrator> {
    const response = await fetch(`${API_URL}/administrators`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },

  async update(
    id: string,
    data: UpdateAdministratorInput,
  ): Promise<Administrator> {
    const response = await fetch(`${API_URL}/administrators/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },

  async setAccess(id: string, hasAccess: boolean): Promise<Administrator> {
    const response = await fetch(`${API_URL}/administrators/${id}/access`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasAccess }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },
};
