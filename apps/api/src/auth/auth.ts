import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { createAuthMiddleware } from 'better-auth/api';
import { deleteSessionCookie } from 'better-auth/cookies';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { prisma } from '@repo/database';
import type {} from 'zod';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ac, admin, staff } from './permissions.js';
import { checkStaffSessionAccess } from './staff-session-access.js';
import { staffSignIn } from './staff-sign-in.js';

type SessionPayload = {
  user?: { id?: string; role?: string | null } | null;
  session?: {
    id?: string;
    activeContestId?: string | null;
  } | null;
} | null;

function withIdCollisionRetry(client: typeof prisma) {
  return client.$extends({
    query: {
      $allModels: {
        async create({ args, query }) {
          for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              const data = args.data;
              const canRetry =
                attempt < ID_MAX_ATTEMPTS - 1 &&
                isIdUniqueViolation(error) &&
                data &&
                typeof data === 'object' &&
                'id' in data;

              if (!canRetry) {
                throw error;
              }

              (data as { id: string }).id = generateShortId();
            }
          }

          throw new Error(
            `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
          );
        },
      },
    },
  });
}

export const auth = betterAuth({
  database: prismaAdapter(withIdCollisionRetry(prisma), {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    additionalFields: {
      activeContestId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3001'],
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  // HTTP local/Docker: Secure cookies are rejected by the browser and login
  // appears to succeed (200) while the session never sticks. HTTPS → secure.
  advanced: {
    useSecureCookies: (
      process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
    ).startsWith('https://'),
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: (
        process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
      ).startsWith('https://'),
    },
    database: {
      generateId: () => generateShortId(),
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/get-session') {
        return;
      }

      const returned = ctx.context.returned;
      if (!returned || returned instanceof Error) {
        return;
      }

      const payload = returned as SessionPayload;
      const user = payload?.user;
      const session = payload?.session;

      if (!user?.id || !session?.id || user.role !== 'staff') {
        return;
      }

      const contestId = session.activeContestId;
      if (!contestId) {
        await prisma.session.deleteMany({ where: { id: session.id } });
        deleteSessionCookie(ctx);
        return ctx.json(null);
      }

      const access = await checkStaffSessionAccess(user.id, contestId);
      if (access.valid) {
        return;
      }

      await prisma.session.deleteMany({ where: { id: session.id } });
      deleteSessionCookie(ctx);
      return ctx.json(null);
    }),
  },
  plugins: [
    adminPlugin({
      ac,
      roles: { admin, staff },
      defaultRole: 'staff',
      adminRoles: ['admin'],
    }),
    staffSignIn(),
  ],
});
