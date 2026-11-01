import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsEventsService } from './teams.events.js';
import { TeamsService } from './teams.service.js';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, TeamsEventsService],
})
export class TeamsModule {}
