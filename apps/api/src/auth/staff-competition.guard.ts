import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { prisma } from '@repo/database';

type AuthRequest = {
  params?: Record<string, string | undefined>;
  session?: {
    user?: { id?: string | null; role?: string | null };
    session?: { activeContestId?: string | null };
  };
};

@Injectable()
export class StaffCompetitionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const role = request.session?.user?.role;

    if (role !== 'staff') {
      return true;
    }

    const activeCompetitionId = request.session?.session?.activeContestId;
    const userId = request.session?.user?.id;
    if (!activeCompetitionId || !userId) {
      throw new ForbiddenException(
        'Sessão de colaborador sem competição ativa.',
      );
    }

    const membership = await prisma.contestCollaborator.findUnique({
      where: {
        competitionId_userId: {
          competitionId: activeCompetitionId,
          userId,
        },
      },
      select: { hasAccess: true },
    });

    if (!membership?.hasAccess) {
      throw new ForbiddenException(
        'Você não tem acesso a esta competição.',
      );
    }

    const params = request.params ?? {};
    const competitionId = params.competitionId ?? params.id;
    const roundId = params.contestId ?? params.roundId;

    if (competitionId && competitionId !== activeCompetitionId) {
      throw new ForbiddenException(
        'Você não tem acesso a esta competição.',
      );
    }

    if (roundId) {
      const round = await prisma.contest.findUnique({
        where: { id: roundId },
        select: { competitionId: true },
      });

      if (!round || round.competitionId !== activeCompetitionId) {
        throw new ForbiddenException(
          'Você não tem acesso a esta rodada.',
        );
      }
    }

    return true;
  }
}
