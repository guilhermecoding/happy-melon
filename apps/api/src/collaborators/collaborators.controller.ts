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

  @Get('contests/:contestId/collaborators')
  list(@Param('contestId') contestId: string) {
    return this.collaboratorsService.list(contestId);
  }

  @Get('contests/:contestId/collaborators/score')
  listScore(@Param('contestId') contestId: string) {
    return this.collaboratorsService.listScore(contestId);
  }

  @Sse('contests/:contestId/collaborators/events')
  streamEvents(
    @Param('contestId') contestId: string,
  ): Observable<MessageEvent> {
    return this.collaboratorsEvents.subscribe(contestId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Post('contests/:contestId/collaborators')
  create(
    @Param('contestId') contestId: string,
    @Req() request: RequestWithHeaders,
    @Body(createCollaboratorPipe) dto: CreateCollaboratorDto,
  ) {
    return this.collaboratorsService.create(request.headers, contestId, dto);
  }

  @Patch('contests/:contestId/collaborators/:userId')
  update(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(updateCollaboratorPipe) dto: UpdateCollaboratorDto,
  ) {
    return this.collaboratorsService.update(
      request.headers,
      contestId,
      userId,
      dto,
    );
  }

  @Patch('contests/:contestId/collaborators/:userId/access')
  setAccess(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(setAccessPipe) dto: SetCollaboratorAccessDto,
  ) {
    return this.collaboratorsService.setAccess(
      request.headers,
      contestId,
      userId,
      dto.hasAccess,
    );
  }

  @Post('contests/:contestId/collaborators/:userId/delete')
  remove(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
  ) {
    return this.collaboratorsService.remove(
      request.headers,
      contestId,
      userId,
    );
  }
}
