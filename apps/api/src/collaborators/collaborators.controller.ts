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
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import { map, type Observable } from 'rxjs';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CollaboratorsEventsService } from './collaborators.events.js';
import { CollaboratorsService } from './collaborators.service.js';
import {
  createCollaboratorSchema,
  setCollaboratorAccessSchema,
  updateCollaboratorSchema,
  type CreateCollaboratorDto,
  type SetCollaboratorAccessDto,
  type UpdateCollaboratorDto,
} from './dto/collaborator.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createCollaboratorPipe = new ZodValidationPipe(createCollaboratorSchema);
const updateCollaboratorPipe = new ZodValidationPipe(updateCollaboratorSchema);
const setAccessPipe = new ZodValidationPipe(setCollaboratorAccessSchema);

@Controller()
@Roles(['admin'])
export class CollaboratorsController {
  constructor(
    private readonly collaboratorsService: CollaboratorsService,
    private readonly collaboratorsEvents: CollaboratorsEventsService,
  ) {}

  @Get('competitions/:competitionId/collaborators')
  list(@Param('competitionId') competitionId: string) {
    return this.collaboratorsService.list(competitionId);
  }

  @Get('competitions/:competitionId/collaborators/score')
  listScore(@Param('competitionId') competitionId: string) {
    return this.collaboratorsService.listScore(competitionId);
  }

  @Sse('competitions/:competitionId/collaborators/events')
  streamEvents(
    @Param('competitionId') competitionId: string,
  ): Observable<MessageEvent> {
    return this.collaboratorsEvents.subscribe(competitionId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Post('competitions/:competitionId/collaborators')
  create(
    @Param('competitionId') competitionId: string,
    @Req() request: RequestWithHeaders,
    @Body(createCollaboratorPipe) dto: CreateCollaboratorDto,
  ) {
    return this.collaboratorsService.create(request.headers, competitionId, dto);
  }

  @Patch('competitions/:competitionId/collaborators/:userId')
  update(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(updateCollaboratorPipe) dto: UpdateCollaboratorDto,
  ) {
    return this.collaboratorsService.update(
      request.headers,
      competitionId,
      userId,
      dto,
    );
  }

  @Patch('competitions/:competitionId/collaborators/:userId/access')
  setAccess(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(setAccessPipe) dto: SetCollaboratorAccessDto,
  ) {
    return this.collaboratorsService.setAccess(
      request.headers,
      competitionId,
      userId,
      dto.hasAccess,
    );
  }

  @Post('competitions/:competitionId/collaborators/:userId/delete')
  remove(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
  ) {
    return this.collaboratorsService.remove(
      request.headers,
      competitionId,
      userId,
    );
  }
}
