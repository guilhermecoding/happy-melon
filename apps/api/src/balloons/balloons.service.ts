import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
  type BalloonDelivery,
  type Prisma,
  type TaskHistory,
} from '@repo/database';
import {
  BALLOON_DELIVERY_STATUS,
  TASK_KIND,
  isConfirmableStatus,
  isWithholdableStatus,
  taskTypeFromStatus,
  toBalloonEffectiveStatus,
  type BalloonDeliveryStatus,
} from '@repo/shared';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import type { TeamQuestionActionDto } from './dto/balloon.dto.js';

const BALLOON_COLOR_LABELS: Record<string, string> = {
  '#000000': 'Preto',
  '#0000FF': 'Azul',
  '#00FFFF': 'Azul claro',
  '#000080': 'Azul marinho',
  '#FFFFFF': 'Branco',
  '#800000': 'Grená',
  '#FF8000': 'Laranja',
  '#C0C0C0': 'Prata',
  '#FF00FF': 'Rosa',
  '#800080': 'Roxo',
  '#008000': 'Verde',
  '#00FF00': 'Verde limão',
  '#FF0000': 'Vermelho',
  '#FFD800': 'Amarelo',
};

const STATUS_ACTION_LABEL = {
  [BALLOON_DELIVERY_STATUS.PENDING]: 'confirmado',
  [BALLOON_DELIVERY_STATUS.PROCESSING]: 'em entrega',
  [BALLOON_DELIVERY_STATUS.DELIVERED]: 'entregue',
  [BALLOON_DELIVERY_STATUS.WITHHELD]: 'retido',
} as const;

type Actor = {
  userId: string;
  name: string;
};

@Injectable()
export class BalloonsService {
  async listByContest(contestId: string, teamId?: string) {
    await this.ensureContestExists(contestId);

    if (teamId) {
      await this.ensureTeamInContest(contestId, teamId);
    }

    const deliveries = await prisma.balloonDelivery.findMany({
      where: {
        contestId,
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return deliveries.map((delivery) => this.toDeliveryResponse(delivery));
  }

  async listTaskHistory(contestId: string) {
    await this.ensureContestExists(contestId);

    const history = await prisma.taskHistory.findMany({
      where: { contestId },
      orderBy: { createdAt: 'desc' },
    });

    return history.map((entry) => this.toHistoryResponse(entry));
  }

  async confirm(
    contestId: string,
    dto: TeamQuestionActionDto,
    actor: Actor,
  ) {
    const { team, question } = await this.resolveTeamAndQuestion(
      contestId,
      dto.teamId,
      dto.questionId,
    );

    const existing = await prisma.balloonDelivery.findUnique({
      where: {
        teamId_questionId: {
          teamId: team.id,
          questionId: question.id,
        },
      },
    });

    const effective = toBalloonEffectiveStatus(
      existing ? this.toStatusDto(existing.status) : null,
    );

    if (!isConfirmableStatus(effective)) {
      throw new BadRequestException(
        'Este balão não pode ser confirmado no status atual.',
      );
    }

    const targetStatus = BALLOON_DELIVERY_STATUS.PENDING;
    const prismaStatus = this.toPrismaStatus(targetStatus);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const delivery = await prisma.$transaction(async (tx) => {
          const saved = existing
            ? await tx.balloonDelivery.update({
                where: { id: existing.id },
                data: {
                  status: prismaStatus,
                  claimedByUserId: null,
                },
              })
            : await tx.balloonDelivery.create({
                data: {
                  id: generateShortId(),
                  contestId,
                  teamId: team.id,
                  questionId: question.id,
                  status: prismaStatus,
                  claimedByUserId: null,
                },
              });

          await this.createHistoryEntry(tx, {
            contestId,
            delivery: saved,
            teamName: team.name,
            balloonColor: question.balloonColor,
            actor,
          });

          return saved;
        });

        return this.toDeliveryResponse(delivery);
      } catch (error) {
        if (
          !existing &&
          attempt < ID_MAX_ATTEMPTS - 1 &&
          isIdUniqueViolation(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  async withhold(
    contestId: string,
    dto: TeamQuestionActionDto,
    actor: Actor,
  ) {
    const { team, question } = await this.resolveTeamAndQuestion(
      contestId,
      dto.teamId,
      dto.questionId,
    );

    const existing = await prisma.balloonDelivery.findUnique({
      where: {
        teamId_questionId: {
          teamId: team.id,
          questionId: question.id,
        },
      },
    });

    if (!existing) {
      throw new BadRequestException(
        'Não há balão registrado para reter.',
      );
    }

    const effective = toBalloonEffectiveStatus(
      this.toStatusDto(existing.status),
    );

    if (!isWithholdableStatus(effective)) {
      throw new BadRequestException(
        'Este balão não pode ser retido no status atual.',
      );
    }

    const targetStatus = BALLOON_DELIVERY_STATUS.WITHHELD;
    const delivery = await prisma.$transaction(async (tx) => {
      const saved = await tx.balloonDelivery.update({
        where: { id: existing.id },
        data: {
          status: this.toPrismaStatus(targetStatus),
          claimedByUserId: null,
        },
      });

      await this.createHistoryEntry(tx, {
        contestId,
        delivery: saved,
        teamName: team.name,
        balloonColor: question.balloonColor,
        actor,
      });

      return saved;
    });

    return this.toDeliveryResponse(delivery);
  }

  private async createHistoryEntry(
    tx: Prisma.TransactionClient,
    params: {
      contestId: string;
      delivery: BalloonDelivery;
      teamName: string;
      balloonColor: string;
      actor: Actor;
    },
  ) {
    const status = this.toStatusDto(params.delivery.status);
    const type = taskTypeFromStatus(status, TASK_KIND.BALLOON_TASK);
    const colorLabel = this.getBalloonColorLabel(params.balloonColor);
    const actionLabel = STATUS_ACTION_LABEL[status];
    const message = `Balão ${colorLabel} do time ${params.teamName} ${actionLabel}`;

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        await tx.taskHistory.create({
          data: {
            id: generateShortId(),
            contestId: params.contestId,
            kind: TASK_KIND.BALLOON_TASK,
            type,
            status: params.delivery.status,
            message,
            teamId: params.delivery.teamId,
            questionId: params.delivery.questionId,
            balloonDeliveryId: params.delivery.id,
            actorUserId: params.actor.userId,
            actorName: params.actor.name,
          },
        });
        return;
      } catch (error) {
        if (
          attempt < ID_MAX_ATTEMPTS - 1 &&
          isIdUniqueViolation(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  private async resolveTeamAndQuestion(
    contestId: string,
    teamId: string,
    questionId: string,
  ) {
    await this.ensureContestExists(contestId);

    const [team, question] = await Promise.all([
      prisma.team.findFirst({ where: { id: teamId, contestId } }),
      prisma.question.findFirst({ where: { id: questionId, contestId } }),
    ]);

    if (!team) {
      throw new NotFoundException('Time não encontrado nesta competição.');
    }

    if (!question) {
      throw new NotFoundException('Questão não encontrada nesta competição.');
    }

    return { team, question };
  }

  private async ensureContestExists(contestId: string) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { id: true },
    });

    if (!contest) {
      throw new NotFoundException('Competição não encontrada.');
    }
  }

  private async ensureTeamInContest(contestId: string, teamId: string) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, contestId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Time não encontrado nesta competição.');
    }
  }

  private getBalloonColorLabel(balloonColor: string): string {
    const normalized = balloonColor.toUpperCase();
    return BALLOON_COLOR_LABELS[normalized] ?? balloonColor;
  }

  private toPrismaStatus(
    status: BalloonDeliveryStatus,
  ): PrismaBalloonDeliveryStatus {
    switch (status) {
      case BALLOON_DELIVERY_STATUS.PENDING:
        return PrismaBalloonDeliveryStatus.PENDING;
      case BALLOON_DELIVERY_STATUS.PROCESSING:
        return PrismaBalloonDeliveryStatus.PROCESSING;
      case BALLOON_DELIVERY_STATUS.DELIVERED:
        return PrismaBalloonDeliveryStatus.DELIVERED;
      case BALLOON_DELIVERY_STATUS.WITHHELD:
        return PrismaBalloonDeliveryStatus.WITHHELD;
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  private toStatusDto(
    status: PrismaBalloonDeliveryStatus,
  ): BalloonDeliveryStatus {
    switch (status) {
      case PrismaBalloonDeliveryStatus.PENDING:
        return BALLOON_DELIVERY_STATUS.PENDING;
      case PrismaBalloonDeliveryStatus.PROCESSING:
        return BALLOON_DELIVERY_STATUS.PROCESSING;
      case PrismaBalloonDeliveryStatus.DELIVERED:
        return BALLOON_DELIVERY_STATUS.DELIVERED;
      case PrismaBalloonDeliveryStatus.WITHHELD:
        return BALLOON_DELIVERY_STATUS.WITHHELD;
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  private toDeliveryResponse(delivery: BalloonDelivery) {
    return {
      id: delivery.id,
      contestId: delivery.contestId,
      teamId: delivery.teamId,
      questionId: delivery.questionId,
      status: this.toStatusDto(delivery.status),
      claimedByUserId: delivery.claimedByUserId,
      createdAt: delivery.createdAt.toISOString(),
      updatedAt: delivery.updatedAt.toISOString(),
    };
  }

  private toHistoryResponse(entry: TaskHistory) {
    return {
      id: entry.id,
      contestId: entry.contestId,
      kind: entry.kind,
      type: entry.type,
      status: this.toStatusDto(entry.status),
      message: entry.message,
      teamId: entry.teamId,
      questionId: entry.questionId,
      balloonDeliveryId: entry.balloonDeliveryId,
      printTaskId: entry.printTaskId,
      actorUserId: entry.actorUserId,
      actorName: entry.actorName,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
