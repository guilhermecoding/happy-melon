import { Module } from '@nestjs/common';
import { ContestTasksModule } from '../contest-tasks/contest-tasks.module.js';
import { ContestsModule } from '../contests/contests.module.js';
import { CompetitionsController } from './competitions.controller.js';
import { CompetitionsService } from './competitions.service.js';

@Module({
  imports: [ContestTasksModule, ContestsModule],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
