import { prisma } from '@repo/database';

/**
 * Ends sessions of one collaborator on a specific competition.
 */
export async function revokeStaffSessionsForCollaborator(
  competitionId: string,
  userId: string,
) {
  await prisma.session.deleteMany({
    where: {
      userId,
      activeContestId: competitionId,
    },
  });
}

export async function revokeChefSessionsForCompetition(
  competitionId: string,
  userId: string,
) {
  await prisma.session.deleteMany({
    where: {
      userId,
      activeContestId: competitionId,
    },
  });
}

export type StaffSessionAccessCheck =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: 'access_disabled' | 'banned' | 'not_member';
    };

/**
 * Whether a staff session may keep using the given competition.
 */
export async function checkStaffSessionAccess(
  userId: string,
  competitionId: string,
): Promise<StaffSessionAccessCheck> {
  const [user, competition, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, role: true },
    }),
    prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true },
    }),
    prisma.contestCollaborator.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
      select: { hasAccess: true },
    }),
  ]);

  if (!user || user.role !== 'staff') {
    return { valid: false, reason: 'not_member' };
  }

  if (user.banned) {
    return { valid: false, reason: 'banned' };
  }

  if (!competition) {
    return { valid: false, reason: 'not_member' };
  }

  if (!membership) {
    return { valid: false, reason: 'not_member' };
  }

  if (!membership.hasAccess) {
    return { valid: false, reason: 'access_disabled' };
  }

  return { valid: true };
}

export type ChefSessionAccessCheck =
  | {
      valid: true;
      competitionId: string;
    }
  | {
      valid: false;
      reason: 'access_disabled' | 'banned' | 'not_member';
    };

/**
 * Whether a chef session may keep using the given competition.
 */
export async function checkChefSessionAccess(
  userId: string,
  competitionId: string,
): Promise<ChefSessionAccessCheck> {
  const [user, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, role: true },
    }),
    prisma.contestChef.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
      select: { hasAccess: true, competitionId: true },
    }),
  ]);

  if (!user || user.role !== 'chef') {
    return { valid: false, reason: 'not_member' };
  }

  if (user.banned) {
    return { valid: false, reason: 'banned' };
  }

  if (!membership) {
    return { valid: false, reason: 'not_member' };
  }

  if (!membership.hasAccess) {
    return { valid: false, reason: 'access_disabled' };
  }

  return { valid: true, competitionId: membership.competitionId };
}

export async function findChefCompetitionId(
  userId: string,
): Promise<string | null> {
  const membership = await prisma.contestChef.findFirst({
    where: { userId, hasAccess: true },
    orderBy: { createdAt: 'asc' },
    select: { competitionId: true },
  });

  return membership?.competitionId ?? null;
}
