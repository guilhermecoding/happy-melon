import { Module } from '@nestjs/common';
import { ContestTasksModule } from '../contest-tasks/contest-tasks.module.js';
import { BalloonsController } from './balloons.controller.js';
import { BalloonsService } from './balloons.service.js';

@Module({
  imports: [ContestTasksModule],
  controllers: [BalloonsController],
  providers: [BalloonsService],
})
export class BalloonsModule {}
