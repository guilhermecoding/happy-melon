import { Controller, Get, MessageEvent, Param, Sse } from '@nestjs/common';
import {
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { map, type Observable } from 'rxjs';
import type { auth } from '../auth/auth.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import { ContestTasksService } from './contest-tasks.service.js';

@Controller()
@Roles(['admin', 'staff'])
export class ContestTasksController {
  constructor(
    private readonly contestTasksService: ContestTasksService,
    private readonly contestTasksEvents: ContestTasksEventsService,
  ) {}

  @Get('contests/:contestId/staff-tasks')
  getStaffTasks(
    @Param('contestId') contestId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.contestTasksService.getStaffTasksSnapshot(
      contestId,
      session.user.id,
    );
  }

  @Sse('contests/:contestId/tasks/events')
  streamEvents(
    @Param('contestId') contestId: string,
  ): Observable<MessageEvent> {
    return this.contestTasksEvents.subscribe(contestId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }
}
