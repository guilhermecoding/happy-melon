import { Module } from '@nestjs/common';
import { ContestTasksController } from './contest-tasks.controller.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import { ContestTasksService } from './contest-tasks.service.js';

@Module({
  controllers: [ContestTasksController],
  providers: [ContestTasksService, ContestTasksEventsService],
  exports: [ContestTasksEventsService],
})
export class ContestTasksModule {}
