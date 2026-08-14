import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type {} from 'zod';
import { ac, admin, staff } from '@/lib/auth/permissions';
import { staffSignInClient } from '@/lib/auth/staff-sign-in-client';

function getAuthBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3001';
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    adminClient({
      ac,
      roles: { admin, staff },
    }),
    staffSignInClient(),
    inferAdditionalFields({
      session: {
        activeContestId: {
          type: 'string',
          required: false,
        },
      },
    }),
  ],
});

export type StaffSignInSuccess = {
  status: 'authenticated';
  contestId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  };
};

export type StaffSignInNeedsRegistration = {
  status: 'needsRegistration';
  contestId: string;
};

export type StaffSignInResult =
  | StaffSignInSuccess
  | StaffSignInNeedsRegistration;
