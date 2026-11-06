import { Module } from '@nestjs/common';
import { ContestTasksController } from './contest-tasks.controller.js';
import { ContestTasksEventsService } from './contest-tasks.events.js';
import { ContestTasksService } from './contest-tasks.service.js';
import { DeliveryTimeoutService } from './delivery-timeout.service.js';
import { LobbyCapacityService } from './lobby-capacity.service.js';
import { MultiTouchBanService } from './multi-touch-ban.service.js';
import { TaskHistoryEventsService } from './task-history.events.js';
import { TaskSummaryEventsService } from './task-summary.events.js';
import { TaskSummaryService } from './task-summary.service.js';

@Module({
  controllers: [ContestTasksController],
  providers: [
    ContestTasksService,
    ContestTasksEventsService,
    DeliveryTimeoutService,
    LobbyCapacityService,
    MultiTouchBanService,
    TaskHistoryEventsService,
    TaskSummaryEventsService,
    TaskSummaryService,
  ],
  exports: [
    ContestTasksEventsService,
    LobbyCapacityService,
    MultiTouchBanService,
    TaskHistoryEventsService,
    TaskSummaryService,
  ],
})
export class ContestTasksModule {}
