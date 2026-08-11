import { Module } from '@nestjs/common';
import { ContestsModule } from '../contests/contests.module.js';
import { CollaboratorsController } from './collaborators.controller.js';
import { CollaboratorsEventsService } from './collaborators.events.js';
import { CollaboratorsService } from './collaborators.service.js';

@Module({
  imports: [ContestsModule],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService, CollaboratorsEventsService],
  exports: [CollaboratorsEventsService],
})
export class CollaboratorsModule {}
