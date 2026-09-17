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
import { ac, admin, chef, staff } from './permissions.js';
import {
  checkChefSessionAccess,
  checkStaffSessionAccess,
  findChefCompetitionId,
} from './staff-session-access.js';
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

const publicAppUrl = (
  process.env.BETTER_AUTH_URL?.trim() ||
  process.env.WEB_ORIGIN?.trim() ||
  'http://localhost:3001'
).replace(/\/$/, '');

const webOrigin = (
  process.env.WEB_ORIGIN?.trim() || publicAppUrl
).replace(/\/$/, '');

export const auth = betterAuth({
  database: prismaAdapter(withIdCollisionRetry(prisma), {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60,
    additionalFields: {
      activeContestId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [...new Set([webOrigin, publicAppUrl])],
  baseURL: publicAppUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  // HTTP local/Docker: Secure cookies are rejected by the browser and login
  // appears to succeed (200) while the session never sticks. HTTPS → secure.
  // baseURL is the public *site* URL (the browser talks to the web origin;
  // Next proxies /api to this process).
  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: publicAppUrl.startsWith('https://'),
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: publicAppUrl.startsWith('https://'),
    },
    database: {
      generateId: () => generateShortId(),
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
          });

          if (user?.role !== 'chef') {
            return { data: session };
          }

          const competitionId = await findChefCompetitionId(session.userId);
          if (!competitionId) {
            return { data: session };
          }

          return {
            data: {
              ...session,
              activeContestId: competitionId,
            },
          };
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const newSession = ctx.context.newSession as {
          user?: { id?: string; role?: string | null } | null;
          session?: { id?: string; activeContestId?: string | null } | null;
        } | null;
        const user = newSession?.user;
        const session = newSession?.session;

        if (!user?.id || !session?.id || user.role !== 'chef') {
          return;
        }

        const competitionId = await findChefCompetitionId(user.id);
        if (!competitionId) {
          await prisma.session.deleteMany({ where: { id: session.id } });
          deleteSessionCookie(ctx);
          return ctx.json(null);
        }

        await prisma.session.update({
          where: { id: session.id },
          data: { activeContestId: competitionId },
        });
        return;
      }

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

      if (!payload || !user?.id || !session?.id) {
        return;
      }

      if (user.role !== 'staff' && user.role !== 'chef') {
        return;
      }

      let contestId = session.activeContestId;
      if (!contestId) {
        const stored = await prisma.session.findUnique({
          where: { id: session.id },
          select: { activeContestId: true },
        });
        contestId = stored?.activeContestId ?? undefined;
      }

      if (user.role === 'chef' && !contestId) {
        contestId = (await findChefCompetitionId(user.id)) ?? undefined;
        if (contestId) {
          await prisma.session.update({
            where: { id: session.id },
            data: { activeContestId: contestId },
          });
          if (payload.session) {
            payload.session.activeContestId = contestId;
          }
        }
      }

      if (!contestId) {
        if (user.role === 'chef') {
          await prisma.session.deleteMany({ where: { id: session.id } });
          deleteSessionCookie(ctx);
          return ctx.json(null);
        }
        return;
      }

      const access =
        user.role === 'chef'
          ? await checkChefSessionAccess(user.id, contestId)
          : await checkStaffSessionAccess(user.id, contestId);
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
      roles: { admin, staff, chef },
      defaultRole: 'staff',
      adminRoles: ['admin'],
    }),
    staffSignIn(),
  ],
});
