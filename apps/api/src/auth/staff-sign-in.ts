import { randomBytes } from 'node:crypto';
import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { ContestStatus, prisma } from '@repo/database';
import { z } from 'zod';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isPrismaUniqueViolation,
} from '../common/short-id.js';

const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const staffSignInBodySchema = z.object({
  email: z.email(),
  contestCode: z.string().min(1),
});

const staffRegisterBodySchema = z.object({
  email: z.email(),
  contestCode: z.string().min(1),
  name: z.string().min(1),
});

function generateRandomPassword(): string {
  return Array.from(
    randomBytes(24),
    (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]!,
  ).join('');
}

async function createCollaboratorMembership(
  contestId: string,
  userId: string,
) {
  for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.contestCollaborator.create({
        data: {
          id: generateShortId(),
          contestId,
          userId,
          hasAccess: true,
        },
      });
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        const existing = await prisma.contestCollaborator.findUnique({
          where: {
            contestId_userId: { contestId, userId },
          },
        });
        if (existing) {
          return existing;
        }
      }

      if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
  );
}

async function findActiveContest(contestCode: string) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestCode },
  });

  if (!contest) {
    throw APIError.from('NOT_FOUND', {
      message: 'Competição não encontrada.',
      code: 'CONTEST_NOT_FOUND',
    });
  }

  if (contest.status !== ContestStatus.ACTIVE) {
    throw APIError.from('FORBIDDEN', {
      message: 'O acesso dos colaboradores está desabilitado para esta competição.',
      code: 'CONTEST_INACTIVE',
    });
  }

  return contest;
}

export const staffSignIn = () =>
  ({
    id: 'staff-sign-in',
    endpoints: {
      signInStaff: createAuthEndpoint(
        '/staff/sign-in',
        {
          method: 'POST',
          body: staffSignInBodySchema,
        },
        async (ctx) => {
          const email = ctx.body.email.toLowerCase().trim();
          const contestCode = ctx.body.contestCode.trim();
          const contest = await findActiveContest(contestCode);

          const found = await ctx.context.internalAdapter.findUserByEmail(email);
          if (!found?.user) {
            return ctx.json({
              status: 'needsRegistration' as const,
              contestId: contest.id,
            });
          }

          const user = await prisma.user.findUnique({
            where: { id: found.user.id },
          });

          if (!user) {
            return ctx.json({
              status: 'needsRegistration' as const,
              contestId: contest.id,
            });
          }

          if (user.role === 'admin') {
            throw APIError.from('FORBIDDEN', {
              message: 'Use o login de administrador para esta conta.',
              code: 'ADMIN_USE_PASSWORD_LOGIN',
            });
          }

          if (user.banned) {
            throw APIError.from('FORBIDDEN', {
              message: 'Sua conta está desativada. Fale com um administrador.',
              code: 'BANNED_USER',
            });
          }

          if (user.role !== 'staff') {
            throw APIError.from('FORBIDDEN', {
              message: 'Esta conta não tem permissão de colaborador.',
              code: 'INVALID_ROLE',
            });
          }

          let membership = await prisma.contestCollaborator.findUnique({
            where: {
              contestId_userId: {
                contestId: contest.id,
                userId: user.id,
              },
            },
          });

          if (!membership) {
            membership = await createCollaboratorMembership(
              contest.id,
              user.id,
            );
          }

          if (!membership.hasAccess) {
            throw APIError.from('FORBIDDEN', {
              message:
                'Seu acesso a esta competição está desabilitado. Fale com um administrador.',
              code: 'COLLABORATOR_ACCESS_DISABLED',
            });
          }

          const session = await ctx.context.internalAdapter.createSession(
            user.id,
            false,
            { activeContestId: contest.id },
          );

          if (!session) {
            throw APIError.from('INTERNAL_SERVER_ERROR', {
              message: 'Não foi possível criar a sessão.',
              code: 'FAILED_TO_CREATE_SESSION',
            });
          }

          await setSessionCookie(ctx, {
            session,
            user: found.user,
          });

          return ctx.json({
            status: 'authenticated' as const,
            contestId: contest.id,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        },
      ),
      registerStaff: createAuthEndpoint(
        '/staff/register',
        {
          method: 'POST',
          body: staffRegisterBodySchema,
        },
        async (ctx) => {
          const email = ctx.body.email.toLowerCase().trim();
          const contestCode = ctx.body.contestCode.trim();
          const name = ctx.body.name.trim();
          const contest = await findActiveContest(contestCode);

          const existing = await ctx.context.internalAdapter.findUserByEmail(
            email,
          );
          if (existing?.user) {
            throw APIError.from('UNPROCESSABLE_ENTITY', {
              message: 'Já existe um usuário com este e-mail. Tente entrar novamente.',
              code: 'USER_ALREADY_EXISTS',
            });
          }

          const passwordHash = await ctx.context.password.hash(
            generateRandomPassword(),
          );

          let createdUser;
          try {
            createdUser = await ctx.context.internalAdapter.createUser({
              email,
              name,
              emailVerified: true,
              role: 'staff',
            });
          } catch (error) {
            ctx.context.logger.error('Failed to create staff user', error);
            throw APIError.from('UNPROCESSABLE_ENTITY', {
              message: 'Não foi possível criar o colaborador.',
              code: 'FAILED_TO_CREATE_USER',
            });
          }

          if (!createdUser) {
            throw APIError.from('UNPROCESSABLE_ENTITY', {
              message: 'Não foi possível criar o colaborador.',
              code: 'FAILED_TO_CREATE_USER',
            });
          }

          await prisma.user.update({
            where: { id: createdUser.id },
            data: {
              role: 'staff',
              emailVerified: true,
            },
          });

          await ctx.context.internalAdapter.linkAccount({
            userId: createdUser.id,
            providerId: 'credential',
            accountId: createdUser.id,
            password: passwordHash,
          });

          await createCollaboratorMembership(contest.id, createdUser.id);

          const session = await ctx.context.internalAdapter.createSession(
            createdUser.id,
            false,
            { activeContestId: contest.id },
          );

          if (!session) {
            throw APIError.from('INTERNAL_SERVER_ERROR', {
              message: 'Não foi possível criar a sessão.',
              code: 'FAILED_TO_CREATE_SESSION',
            });
          }

          await setSessionCookie(ctx, {
            session,
            user: createdUser,
          });

          return ctx.json({
            status: 'authenticated' as const,
            contestId: contest.id,
            user: {
              id: createdUser.id,
              name: createdUser.name,
              email: createdUser.email,
              role: 'staff',
            },
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
