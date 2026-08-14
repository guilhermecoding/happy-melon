import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BalloonDeliveryStatus as PrismaBalloonDeliveryStatus,
  prisma,
  type PrintTask,
  type Prisma,
} from '@repo/database';
import {
  BALLOON_DELIVERY_STATUS,
  STAFF_TASK_EVENT_TYPE,
  TASK_HISTORY_EVENT_TYPE,
  TASK_KIND,
  isConfirmableStatus,
  isWithholdableStatus,
  taskTypeFromStatus,
  toBalloonEffectiveStatus,
  type BalloonDeliveryStatus,
  type StaffTask,
} from '@repo/shared';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
} from '../common/short-id.js';
import { ContestTasksEventsService } from '../contest-tasks/contest-tasks.events.js';
import { assertContestInProgress } from '../contests/contest-window.js';
import { LobbyCapacityService } from '../contest-tasks/lobby-capacity.service.js';
import {
  teamFieldsFrom,
  toPrintStaffTask,
} from '../contest-tasks/staff-task.mapper.js';
import { TaskHistoryEventsService } from '../contest-tasks/task-history.events.js';
import { toTaskHistoryEntryDto } from '../contest-tasks/task-history.mapper.js';
import type { PrintTeamActionDto } from './dto/print.dto.js';

const STATUS_ACTION_LABEL = {
  [BALLOON_DELIVERY_STATUS.PENDING]: 'confirmada',
  [BALLOON_DELIVERY_STATUS.PROCESSING]: 'em rota de entrega',
  [BALLOON_DELIVERY_STATUS.DELIVERED]: 'entregue',
  [BALLOON_DELIVERY_STATUS.WITHHELD]: 'retida',
} as const;

type Actor = {
  userId: string;
  name: string;
};

@Injectable()
export class PrintsService {
  constructor(
    private readonly contestTasksEvents: ContestTasksEventsService,
    private readonly taskHistoryEvents: TaskHistoryEventsService,
    private readonly lobbyCapacity: LobbyCapacityService,
  ) { }

  async listByContest(contestId: string, teamId?: string) {
    await this.ensureContestExists(contestId);

    if (teamId) {
      await this.ensureTeamInContest(contestId, teamId);
    }

    const tasks = await prisma.printTask.findMany({
      where: {
        contestId,
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return tasks.map((task) => this.toTaskResponse(task));
  }

  async enqueue(
    contestId: string,
    dto: PrintTeamActionDto,
    actor: Actor,
  ) {
    const team = await this.ensureTeamInContest(contestId, dto.teamId);
    const prismaStatus = this.toPrismaStatus(BALLOON_DELIVERY_STATUS.PENDING);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const { task, history } = await prisma.$transaction(async (tx) => {
          const saved = await tx.printTask.create({
            data: {
              id: generateShortId(),
              contestId,
              teamId: team.id,
              status: prismaStatus,
              claimedByUserId: null,
            },
          });

          const history = await this.createHistoryEntry(tx, {
            contestId,
            task: saved,
            teamName: team.name,
            actor,
          });

          return { task: saved, history };
        });

        this.contestTasksEvents.emit(contestId, {
          type: STAFF_TASK_EVENT_TYPE.QUEUED,
          task: toPrintStaffTask({
            id: task.id,
            contestId: task.contestId,
            teamId: task.teamId,
            ...teamFieldsFrom(team),
            status: task.status,
            claimedByUserId: task.claimedByUserId,
            claimedAt: task.claimedAt,
            createdAt: task.createdAt,
          }),
        });

        this.emitHistoryCreated(contestId, history);

        return this.toTaskResponse(task);
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

  async confirm(contestId: string, taskId: string, actor: Actor) {
    const { task, team } = await this.resolveTask(contestId, taskId);
    const effective = toBalloonEffectiveStatus(this.toStatusDto(task.status));

    if (!isConfirmableStatus(effective)) {
      throw new BadRequestException(
        'Esta impressão não pode ser confirmada no status atual.',
      );
    }

    const { saved, history } = await prisma.$transaction(async (tx) => {
      const updated = await tx.printTask.update({
        where: { id: task.id },
        data: {
          status: this.toPrismaStatus(BALLOON_DELIVERY_STATUS.PENDING),
          claimedByUserId: null,
          claimedAt: null,
        },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId,
        task: updated,
        teamName: team.name,
        actor,
      });

      return { saved: updated, history };
    });

    this.contestTasksEvents.emit(contestId, {
      type: STAFF_TASK_EVENT_TYPE.QUEUED,
      task: toPrintStaffTask({
        id: saved.id,
        contestId: saved.contestId,
        teamId: saved.teamId,
        ...teamFieldsFrom(team),
        status: saved.status,
        claimedByUserId: saved.claimedByUserId,
        claimedAt: saved.claimedAt,
        createdAt: saved.createdAt,
      }),
    });

    this.emitHistoryCreated(contestId, history);

    return this.toTaskResponse(saved);
  }

  async withhold(contestId: string, taskId: string, actor: Actor) {
    const { task, team } = await this.resolveTask(contestId, taskId);
    const effective = toBalloonEffectiveStatus(this.toStatusDto(task.status));

    if (!isWithholdableStatus(effective)) {
      throw new BadRequestException(
        'Esta impressão não pode ser retida no status atual.',
      );
    }

    const { saved, history } = await prisma.$transaction(async (tx) => {
      const updated = await tx.printTask.update({
        where: { id: task.id },
        data: {
          status: this.toPrismaStatus(BALLOON_DELIVERY_STATUS.WITHHELD),
          claimedByUserId: null,
          claimedAt: null,
        },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId,
        task: updated,
        teamName: team.name,
        actor,
      });

      return { saved: updated, history };
    });

    this.contestTasksEvents.emit(contestId, {
      type: STAFF_TASK_EVENT_TYPE.REMOVED,
      task: toPrintStaffTask({
        id: saved.id,
        contestId: saved.contestId,
        teamId: saved.teamId,
        ...teamFieldsFrom(team),
        status: saved.status,
        claimedByUserId: saved.claimedByUserId,
        claimedAt: saved.claimedAt,
        createdAt: saved.createdAt,
      }),
    });

    this.emitHistoryCreated(contestId, history);

    return this.toTaskResponse(saved);
  }

  async claim(
    contestId: string,
    taskId: string,
    actor: Actor,
  ): Promise<StaffTask> {
    await this.ensureContestExists(contestId);
    await assertContestInProgress(contestId);

    const pendingStatus = this.toPrismaStatus(BALLOON_DELIVERY_STATUS.PENDING);
    const processingStatus = this.toPrismaStatus(
      BALLOON_DELIVERY_STATUS.PROCESSING,
    );

    const { task, history } = await prisma.$transaction(async (tx) => {
      await this.lobbyCapacity.assertCanClaim(tx, contestId, actor.userId);

      const updated = await tx.printTask.updateMany({
        where: {
          id: taskId,
          contestId,
          status: pendingStatus,
          claimedByUserId: null,
        },
        data: {
          status: processingStatus,
          claimedByUserId: actor.userId,
          claimedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new BadRequestException(
          'Ops! Alguém foi ligeiro e já pegou essa task. Tente outra!',
        );
      }

      const saved = await tx.printTask.findFirstOrThrow({
        where: { id: taskId, contestId },
        include: { team: true },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId,
        task: saved,
        teamName: saved.team.name,
        actor,
      });

      return { task: saved, history };
    });

    const staffTask = toPrintStaffTask({
      id: task.id,
      contestId: task.contestId,
      teamId: task.teamId,
      ...teamFieldsFrom(task.team),
      status: task.status,
      claimedByUserId: task.claimedByUserId,
      claimedAt: task.claimedAt,
      createdAt: task.createdAt,
    });

    this.contestTasksEvents.emit(contestId, {
      type: STAFF_TASK_EVENT_TYPE.CLAIMED,
      task: staffTask,
    });

    this.emitHistoryCreated(contestId, history);

    return staffTask;
  }

  async deliver(
    contestId: string,
    taskId: string,
    actor: Actor,
  ): Promise<StaffTask> {
    await this.ensureContestExists(contestId);
    await assertContestInProgress(contestId);

    const processingStatus = this.toPrismaStatus(
      BALLOON_DELIVERY_STATUS.PROCESSING,
    );
    const deliveredStatus = this.toPrismaStatus(
      BALLOON_DELIVERY_STATUS.DELIVERED,
    );

    const { task, history } = await prisma.$transaction(async (tx) => {
      const updated = await tx.printTask.updateMany({
        where: {
          id: taskId,
          contestId,
          status: processingStatus,
          claimedByUserId: actor.userId,
        },
        data: {
          status: deliveredStatus,
          claimedAt: null,
        },
      });

      if (updated.count !== 1) {
        throw new BadRequestException(
          'Esta tarefa não pode ser marcada como entregue.',
        );
      }

      const saved = await tx.printTask.findFirstOrThrow({
        where: { id: taskId, contestId },
        include: { team: true },
      });

      const history = await this.createHistoryEntry(tx, {
        contestId,
        task: saved,
        teamName: saved.team.name,
        actor,
      });

      return { task: saved, history };
    });

    const staffTask = toPrintStaffTask({
      id: task.id,
      contestId: task.contestId,
      teamId: task.teamId,
      ...teamFieldsFrom(task.team),
      status: task.status,
      claimedByUserId: task.claimedByUserId,
      claimedAt: task.claimedAt,
      createdAt: task.createdAt,
    });

    this.contestTasksEvents.emit(contestId, {
      type: STAFF_TASK_EVENT_TYPE.REMOVED,
      task: staffTask,
    });

    this.emitHistoryCreated(contestId, history);

    return staffTask;
  }

  private async createHistoryEntry(
    tx: Prisma.TransactionClient,
    params: {
      contestId: string;
      task: PrintTask;
      teamName: string;
      actor: Actor;
    },
  ) {
    const status = this.toStatusDto(params.task.status);
    const type = taskTypeFromStatus(status, TASK_KIND.PRINT_TASK);
    const actionLabel = STATUS_ACTION_LABEL[status];
    const message = `Impressão do time ${params.teamName} ${actionLabel}`;

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        return await tx.taskHistory.create({
          data: {
            id: generateShortId(),
            contestId: params.contestId,
            kind: TASK_KIND.PRINT_TASK,
            type,
            status: params.task.status,
            message,
            teamId: params.task.teamId,
            printTaskId: params.task.id,
            relatedTaskId: params.task.id,
            actorUserId: params.actor.userId,
            actorName: params.actor.name,
          },
        });
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

  private emitHistoryCreated(
    contestId: string,
    history: Parameters<typeof toTaskHistoryEntryDto>[0],
  ) {
    this.taskHistoryEvents.emit(contestId, {
      type: TASK_HISTORY_EVENT_TYPE.CREATED,
      entry: toTaskHistoryEntryDto(history),
    });
  }

  private async resolveTask(contestId: string, taskId: string) {
    await this.ensureContestExists(contestId);

    const task = await prisma.printTask.findFirst({
      where: { id: taskId, contestId },
      include: { team: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa de impressão não encontrada.');
    }

    return { task, team: task.team };
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
    await this.ensureContestExists(contestId);

    const team = await prisma.team.findFirst({
      where: { id: teamId, contestId },
    });

    if (!team) {
      throw new NotFoundException('Time não encontrado nesta competição.');
    }

    return team;
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

  private toTaskResponse(task: PrintTask) {
    return {
      id: task.id,
      contestId: task.contestId,
      teamId: task.teamId,
      status: this.toStatusDto(task.status),
      claimedByUserId: task.claimedByUserId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
