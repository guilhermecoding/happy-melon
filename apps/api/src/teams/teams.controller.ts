import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TeamsService } from './teams.service.js';
import {
  bulkUpsertTeamsSchema,
  createTeamSchema,
  updateTeamSchema,
  type BulkUpsertTeamsDto,
  type CreateTeamDto,
  type UpdateTeamDto,
} from './dto/team.dto.js';

const createTeamPipe = new ZodValidationPipe(createTeamSchema);
const updateTeamPipe = new ZodValidationPipe(updateTeamSchema);
const bulkUpsertTeamsPipe = new ZodValidationPipe(bulkUpsertTeamsSchema);

@Controller()
@Roles(['admin'])
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('contests/:contestId/teams')
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

  @Patch('teams/:id')
  update(
    @Param('id') id: string,
    @Body(updateTeamPipe) dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, dto);
  }
}
