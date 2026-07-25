import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { prisma } from '@repo/database';
import type {} from 'zod';
import { ac, admin, staff } from './permissions.js';

const ID_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;
const ID_MAX_ATTEMPTS = 10;

function generateShortId(length = ID_LENGTH): string {
  const bytes = randomBytes(length);
  let id = '';

  for (let i = 0; i < length; i++) {
    id += ID_ALPHABET[bytes[i]! % ID_ALPHABET.length];
  }

  return id;
}

function isIdUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    meta?: { target?: string | string[] };
  };

  if (candidate.code !== 'P2002') {
    return false;
  }

  const target = candidate.meta?.target;

  if (Array.isArray(target)) {
    return target.includes('id');
  }

  return target === 'id';
}

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
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3001'],
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
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
  ],
});
