import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
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

  @Get('contests/:contestId/teams')
  @Roles(['admin', 'staff'])
  listByContest(@Param('contestId') contestId: string) {
    return this.teamsService.listByContest(contestId);
  }

  @Post('contests/:contestId/teams')
  create(
    @Param('contestId') contestId: string,
    @Body(createTeamPipe) dto: CreateTeamDto,
  ) {
    return this.teamsService.create(contestId, dto);
  }

  @Post('contests/:contestId/teams/bulk')
  bulkUpsert(
    @Param('contestId') contestId: string,
    @Body(bulkUpsertTeamsPipe) dto: BulkUpsertTeamsDto,
  ) {
    return this.teamsService.bulkUpsert(contestId, dto);
  }

  @Post('contests/:contestId/teams/delete')
  removeAllByContest(
    @Req() request: RequestWithHeaders,
    @Param('contestId') contestId: string,
    @Body(deleteTeamPipe) dto: DeleteTeamDto,
  ) {
    return this.teamsService.removeAllByContest(
      request.headers,
      contestId,
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
