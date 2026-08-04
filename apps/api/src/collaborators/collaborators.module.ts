import { Module } from '@nestjs/common';
import { CollaboratorsController } from './collaborators.controller.js';
import { CollaboratorsService } from './collaborators.service.js';

@Module({
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
})
export class CollaboratorsModule {}
