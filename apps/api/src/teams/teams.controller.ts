import { Body, Controller, Get, MessageEvent, Param, Patch, Post, Req, Sse, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import { map, type Observable } from 'rxjs';
import { StaffCompetitionGuard } from '../auth/staff-competition.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TeamsEventsService } from './teams.events.js';
import { TeamsService } from './teams.service.js';
import {
  bulkUpsertTeamsSchema,
  createTeamSchema,
  deleteTeamSchema,
  updateTeamPlacementSchema,
  updateTeamSchema,
  type BulkUpsertTeamsDto,
  type CreateTeamDto,
  type DeleteTeamDto,
  type UpdateTeamDto,
  type UpdateTeamPlacementDto,
} from './dto/team.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createTeamPipe = new ZodValidationPipe(createTeamSchema);
const updateTeamPipe = new ZodValidationPipe(updateTeamSchema);
const bulkUpsertTeamsPipe = new ZodValidationPipe(bulkUpsertTeamsSchema);
const deleteTeamPipe = new ZodValidationPipe(deleteTeamSchema);
const updateTeamPlacementPipe = new ZodValidationPipe(updateTeamPlacementSchema);

@Controller()
@Roles(['admin'])
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamsEvents: TeamsEventsService,
  ) {}

  @Get('competitions/:competitionId/teams')
  @Roles(['admin', 'staff', 'chef'])
  @UseGuards(StaffCompetitionGuard)
  listByContest(@Param('competitionId') competitionId: string) {
    return this.teamsService.listByCompetition(competitionId);
  }

  @Sse('competitions/:competitionId/teams/events')
  @Roles(['admin', 'staff', 'chef'])
  @UseGuards(StaffCompetitionGuard)
  stream(
    @Param('competitionId') competitionId: string,
  ): Observable<MessageEvent> {
    return this.teamsEvents.subscribe(competitionId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Patch('competitions/:competitionId/teams/:teamId/placement')
  @Roles(['staff'])
  @UseGuards(StaffCompetitionGuard)
  updatePlacement(
    @Param('competitionId') competitionId: string,
    @Param('teamId') teamId: string,
    @Body(updateTeamPlacementPipe) dto: UpdateTeamPlacementDto,
  ) {
    return this.teamsService.updatePlacement(competitionId, teamId, dto);
  }

  @Post('competitions/:competitionId/teams')
  create(
    @Param('competitionId') competitionId: string,
    @Body(createTeamPipe) dto: CreateTeamDto,
  ) {
    return this.teamsService.create(competitionId, dto);
  }

  @Post('competitions/:competitionId/teams/bulk')
  bulkUpsert(
    @Param('competitionId') competitionId: string,
    @Body(bulkUpsertTeamsPipe) dto: BulkUpsertTeamsDto,
  ) {
    return this.teamsService.bulkUpsert(competitionId, dto);
  }

  @Post('competitions/:competitionId/teams/delete')
  removeAllByContest(
    @Req() request: RequestWithHeaders,
    @Param('competitionId') competitionId: string,
    @Body(deleteTeamPipe) dto: DeleteTeamDto,
  ) {
    return this.teamsService.removeAllByCompetition(
      request.headers,
      competitionId,
      dto,
    );
  }

  @Patch('teams/:id')
  update(
    @Param('id') id: string,
    @Body(updateTeamPipe) dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, dto);
  }

  @Post('teams/:id/delete')
  remove(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(deleteTeamPipe) dto: DeleteTeamDto,
  ) {
    return this.teamsService.remove(request.headers, id, dto);
  }
}
