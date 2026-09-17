import { Module } from '@nestjs/common';
import { ContestAccessEventsService } from './contest-access.events.js';

@Module({
  providers: [ContestAccessEventsService],
  exports: [ContestAccessEventsService],
})
export class ContestsModule {}
