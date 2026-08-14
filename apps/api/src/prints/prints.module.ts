import { Module } from '@nestjs/common';
import { ContestTasksModule } from '../contest-tasks/contest-tasks.module.js';
import { PrintsController } from './prints.controller.js';
import { PrintsService } from './prints.service.js';

@Module({
  imports: [ContestTasksModule],
  controllers: [PrintsController],
  providers: [PrintsService],
})
export class PrintsModule {}
