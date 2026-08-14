import { ContestStatus, prisma } from '@repo/database';

/**
 * Ends all staff sessions bound to a contest (e.g. when collaborator access
 * is disabled for the whole competition).
 */
export async function revokeStaffSessionsForContest(contestId: string) {
  await prisma.session.deleteMany({
    where: { activeContestId: contestId },
  });
}

/**
 * Ends sessions of one collaborator on a specific contest.
 */
export async function revokeStaffSessionsForCollaborator(
  contestId: string,
  userId: string,
) {
  await prisma.session.deleteMany({
    where: {
      userId,
      activeContestId: contestId,
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
 * Whether a staff session may keep using the given contest.
 */
export async function checkStaffSessionAccess(
  userId: string,
  contestId: string,
): Promise<StaffSessionAccessCheck> {
  const [user, contest, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, role: true },
    }),
    prisma.contest.findUnique({
      where: { id: contestId },
      select: { status: true },
    }),
    prisma.contestCollaborator.findUnique({
      where: {
        contestId_userId: { contestId, userId },
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

  if (!contest || contest.status !== ContestStatus.ACTIVE) {
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
