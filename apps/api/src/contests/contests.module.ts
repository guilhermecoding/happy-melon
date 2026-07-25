import { Module } from '@nestjs/common';
import { ContestsController } from './contests.controller.js';
import { ContestsService } from './contests.service.js';

@Module({
  controllers: [ContestsController],
  providers: [ContestsService],
})
export class ContestsModule {}
