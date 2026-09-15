import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import { map, type Observable } from 'rxjs';
import { StaffCompetitionGuard } from '../auth/staff-competition.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ContestAccessEventsService } from '../contests/contest-access.events.js';
import { CompetitionsService } from './competitions.service.js';
import {
  createCompetitionSchema,
  createRoundSchema,
  deleteRoundSchema,
  staffSettingsSchema,
  updateCompetitionSchema,
  updateRoundSchema,
  type CreateCompetitionDto,
  type CreateRoundDto,
  type DeleteRoundDto,
  type StaffSettingsDto,
  type UpdateCompetitionDto,
  type UpdateRoundDto,
} from './dto/competition.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createCompetitionPipe = new ZodValidationPipe(createCompetitionSchema);
const updateCompetitionPipe = new ZodValidationPipe(updateCompetitionSchema);
const createRoundPipe = new ZodValidationPipe(createRoundSchema);
const updateRoundPipe = new ZodValidationPipe(updateRoundSchema);
const deleteRoundPipe = new ZodValidationPipe(deleteRoundSchema);
const staffSettingsPipe = new ZodValidationPipe(staffSettingsSchema);

@Controller('competitions')
@Roles(['admin'])
export class CompetitionsController {
  constructor(
    private readonly competitionsService: CompetitionsService,
    private readonly contestAccessEvents: ContestAccessEventsService,
  ) {}

  @Get()
  list() {
    return this.competitionsService.list();
  }

  @Get(':id')
  @Roles(['admin', 'staff'])
  @UseGuards(StaffCompetitionGuard)
  findById(@Param('id') id: string) {
    return this.competitionsService.findById(id);
  }

  @Sse(':id/access/events')
  @Roles(['admin', 'staff'])
  @UseGuards(StaffCompetitionGuard)
  streamAccessEvents(
    @Param('id') competitionId: string,
  ): Observable<MessageEvent> {
    return this.contestAccessEvents.subscribe(competitionId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Post()
  create(@Body(createCompetitionPipe) dto: CreateCompetitionDto) {
    return this.competitionsService.create(dto);
  }

  @Patch(':id/staff-settings')
  updateStaffSettings(
    @Param('id') id: string,
    @Body(staffSettingsPipe) dto: StaffSettingsDto,
  ) {
    return this.competitionsService.updateStaffSettings(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(updateCompetitionPipe) dto: UpdateCompetitionDto,
  ) {
    return this.competitionsService.update(id, dto);
  }

  @Post(':id/rounds')
  createRound(
    @Param('id') competitionId: string,
    @Body(createRoundPipe) dto: CreateRoundDto,
  ) {
    return this.competitionsService.createRound(competitionId, dto);
  }

  @Patch(':id/rounds/:roundId')
  updateRound(
    @Param('id') competitionId: string,
    @Param('roundId') roundId: string,
    @Body(updateRoundPipe) dto: UpdateRoundDto,
  ) {
    return this.competitionsService.updateRound(competitionId, roundId, dto);
  }

  @Post(':id/rounds/:roundId/delete')
  deleteRound(
    @Req() request: RequestWithHeaders,
    @Param('id') competitionId: string,
    @Param('roundId') roundId: string,
    @Body(deleteRoundPipe) dto: DeleteRoundDto,
  ) {
    return this.competitionsService.deleteRound(
      request.headers,
      competitionId,
      roundId,
      dto,
    );
  }
}
