import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import {
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { map, type Observable } from 'rxjs';
import type { auth } from '../auth/auth.js';
import { TaskHistoryEventsService } from '../contest-tasks/task-history.events.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { BalloonsService } from './balloons.service.js';
import {
  teamQuestionActionSchema,
  type TeamQuestionActionDto,
} from './dto/balloon.dto.js';

const teamQuestionActionPipe = new ZodValidationPipe(teamQuestionActionSchema);

@Controller()
@Roles(['admin', 'staff'])
export class BalloonsController {
  constructor(
    private readonly balloonsService: BalloonsService,
    private readonly taskHistoryEvents: TaskHistoryEventsService,
  ) {}

  @Get('contests/:contestId/balloon-deliveries')
  listByContest(
    @Param('contestId') contestId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.balloonsService.listByContest(contestId, teamId);
  }

  @Get('contests/:contestId/task-history')
  listTaskHistory(@Param('contestId') contestId: string) {
    return this.balloonsService.listTaskHistory(contestId);
  }

  @Sse('contests/:contestId/task-history/events')
  streamTaskHistory(
    @Param('contestId') contestId: string,
  ): Observable<MessageEvent> {
    return this.taskHistoryEvents.subscribe(contestId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Get('contests/:contestId/task-history/by-task/:relatedTaskId')
  listTaskTimeline(
    @Param('contestId') contestId: string,
    @Param('relatedTaskId') relatedTaskId: string,
    @Query('kind') kind?: string,
  ) {
    return this.balloonsService.listTaskTimeline(
      contestId,
      relatedTaskId,
      kind,
    );
  }

  @Post('contests/:contestId/balloon-deliveries/confirm')
  confirm(
    @Param('contestId') contestId: string,
    @Body(teamQuestionActionPipe) dto: TeamQuestionActionDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.confirm(contestId, dto, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/balloon-deliveries/withhold')
  withhold(
    @Param('contestId') contestId: string,
    @Body(teamQuestionActionPipe) dto: TeamQuestionActionDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.withhold(contestId, dto, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/balloon-deliveries/:taskId/claim')
  claim(
    @Param('contestId') contestId: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.claim(contestId, taskId, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/balloon-deliveries/:taskId/deliver')
  deliver(
    @Param('contestId') contestId: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.deliver(contestId, taskId, {
      userId: session.user.id,
      name: session.user.name,
    });
  }
}
