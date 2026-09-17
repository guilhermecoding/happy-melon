import { ContestStatus, prisma } from '@repo/database';

/**
 * Ends all staff sessions bound to a competition (e.g. when collaborator access
 * is disabled for the whole event). Chef sessions stay so the chef can re-enable access.
 */
export async function revokeStaffSessionsForContest(competitionId: string) {
  await prisma.session.deleteMany({
    where: {
      activeContestId: competitionId,
      user: { role: 'staff' },
    },
  });
}

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
      reason: 'contest_inactive' | 'access_disabled' | 'banned' | 'not_member';
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
      select: { status: true },
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

  if (!competition || competition.status !== ContestStatus.ACTIVE) {
    return { valid: false, reason: 'contest_inactive' };
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
 * Does not require the competition to be ACTIVE — chefs can re-enable collaborator access.
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
