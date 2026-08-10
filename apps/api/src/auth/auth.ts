import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { prisma } from '@repo/database';
import type {} from 'zod';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ac, admin, staff } from './permissions.js';
import { staffSignIn } from './staff-sign-in.js';

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
