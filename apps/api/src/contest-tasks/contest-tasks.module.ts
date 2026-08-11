import { Module } from '@nestjs/common';
import { ContestTasksController } from './contest-tasks.controller.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import { ContestTasksService } from './contest-tasks.service.js';
import { TaskHistoryEventsService } from './task-history.events.js';

@Module({
  controllers: [ContestTasksController],
  providers: [
    ContestTasksService,
    ContestTasksEventsService,
    TaskHistoryEventsService,
  ],
  exports: [ContestTasksEventsService, TaskHistoryEventsService],
})
export class ContestTasksModule {}
