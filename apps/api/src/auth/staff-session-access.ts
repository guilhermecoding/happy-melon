import { ContestStatus, prisma } from '@repo/database';

/**
 * Ends all staff sessions bound to a competition (e.g. when collaborator access
 * is disabled for the whole event).
 */
export async function revokeStaffSessionsForContest(competitionId: string) {
  await prisma.session.deleteMany({
    where: { activeContestId: competitionId },
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

export type StaffSessionAccessCheck = {
  valid: true;
} | {
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
