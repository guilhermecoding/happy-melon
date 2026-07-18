import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { prisma } from '@repo/database';
import type {} from 'zod';
import { ac, admin, staff } from './permissions.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3001'],
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [
    adminPlugin({
      ac,
      roles: { admin, staff },
      defaultRole: 'staff',
      adminRoles: ['admin'],
    }),
  ],
});
