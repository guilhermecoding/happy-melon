import { Module } from '@nestjs/common';
import { ContestTasksModule } from '../contest-tasks/contest-tasks.module.js';
import { ContestAccessEventsService } from './contest-access.events.js';
import { ContestsController } from './contests.controller.js';
import { ContestsService } from './contests.service.js';

@Module({
  imports: [ContestTasksModule],
  controllers: [ContestsController],
  providers: [ContestsService, ContestAccessEventsService],
  exports: [ContestAccessEventsService],
})
export class ContestsModule {}
