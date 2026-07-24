import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import type {} from 'zod';
import { ac, admin, staff } from '@/lib/auth/permissions';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    adminClient({
      ac,
      roles: { admin, staff },
    }),
  ],
});
