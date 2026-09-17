import {
  Controller,
  Get,
  MessageEvent,
  Param,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { map, type Observable } from 'rxjs';
import type { auth } from '../auth/auth.js';
import { StaffCompetitionGuard } from '../auth/staff-competition.guard.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import { ContestTasksService } from './contest-tasks.service.js';

@Controller()
@Roles(['admin', 'staff', 'chef'])
@UseGuards(StaffCompetitionGuard)
export class ContestTasksController {
  constructor(
    private readonly contestTasksService: ContestTasksService,
    private readonly contestTasksEvents: ContestTasksEventsService,
  ) {}

  @Get('competitions/:competitionId/staff-tasks')
  getCompetitionStaffTasks(
    @Param('competitionId') competitionId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.contestTasksService.getCompetitionStaffTasksSnapshot(
      competitionId,
      session.user.id,
    );
  }

  @Sse('competitions/:competitionId/tasks/events')
  streamCompetitionEvents(
    @Param('competitionId') competitionId: string,
  ): Observable<MessageEvent> {
    return this.contestTasksEvents.subscribe(competitionId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }
}
