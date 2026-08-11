import { Module } from '@nestjs/common';
import { ContestAccessEventsService } from './contest-access.events.js';
import { ContestsController } from './contests.controller.js';
import { ContestsService } from './contests.service.js';

@Module({
  controllers: [ContestsController],
  providers: [ContestsService, ContestAccessEventsService],
  exports: [ContestAccessEventsService],
})
export class ContestsModule {}
