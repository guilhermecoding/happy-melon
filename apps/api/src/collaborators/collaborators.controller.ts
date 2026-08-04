import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
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
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Get('contests/:contestId/collaborators')
  list(@Param('contestId') contestId: string) {
    return this.collaboratorsService.list(contestId);
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
    @Body(setAccessPipe) dto: SetCollaboratorAccessDto,
  ) {
    return this.collaboratorsService.setAccess(
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
