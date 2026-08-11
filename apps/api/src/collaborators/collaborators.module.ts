import { Module } from '@nestjs/common';
import { CollaboratorsController } from './collaborators.controller.js';
import { CollaboratorsEventsService } from './collaborators.events.js';
import { CollaboratorsService } from './collaborators.service.js';

@Module({
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService, CollaboratorsEventsService],
  exports: [CollaboratorsEventsService],
})
export class CollaboratorsModule {}
