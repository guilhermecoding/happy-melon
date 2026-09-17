import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import { StaffCompetitionGuard } from '../auth/staff-competition.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TeamsService } from './teams.service.js';
import {
  bulkUpsertTeamsSchema,
  createTeamSchema,
  deleteTeamSchema,
  updateTeamSchema,
  type BulkUpsertTeamsDto,
  type CreateTeamDto,
  type DeleteTeamDto,
  type UpdateTeamDto,
} from './dto/team.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createTeamPipe = new ZodValidationPipe(createTeamSchema);
const updateTeamPipe = new ZodValidationPipe(updateTeamSchema);
const bulkUpsertTeamsPipe = new ZodValidationPipe(bulkUpsertTeamsSchema);
const deleteTeamPipe = new ZodValidationPipe(deleteTeamSchema);

@Controller()
@Roles(['admin'])
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('competitions/:competitionId/teams')
  @Roles(['admin', 'staff', 'chef'])
  @UseGuards(StaffCompetitionGuard)
  listByContest(@Param('competitionId') competitionId: string) {
    return this.teamsService.listByCompetition(competitionId);
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
