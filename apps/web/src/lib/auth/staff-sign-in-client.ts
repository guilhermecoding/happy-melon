import type { BetterAuthClientPlugin } from 'better-auth/client';

/**
 * Client mirror of the staff sign-in/register plugin.
 * Server implementation lives in apps/api; this only provides typed paths.
 */
export const staffSignInClient = () =>
  ({
    id: 'staff-sign-in',
  }) satisfies BetterAuthClientPlugin;
