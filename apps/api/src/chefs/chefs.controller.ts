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
import { ChefsService } from './chefs.service.js';
import {
  createChefSchema,
  deleteChefSchema,
  resetPasswordChefSchema,
  setChefAccessSchema,
  updateChefSchema,
  type CreateChefDto,
  type DeleteChefDto,
  type ResetPasswordChefDto,
  type SetChefAccessDto,
  type UpdateChefDto,
} from './dto/chef.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createChefPipe = new ZodValidationPipe(createChefSchema);
const updateChefPipe = new ZodValidationPipe(updateChefSchema);
const setAccessPipe = new ZodValidationPipe(setChefAccessSchema);
const deleteChefPipe = new ZodValidationPipe(deleteChefSchema);
const resetPasswordChefPipe = new ZodValidationPipe(resetPasswordChefSchema);

@Controller()
@Roles(['admin'])
export class ChefsController {
  constructor(private readonly chefsService: ChefsService) {}

  @Get('competitions/:competitionId/chefs')
  list(@Param('competitionId') competitionId: string) {
    return this.chefsService.list(competitionId);
  }

  @Post('competitions/:competitionId/chefs')
  create(
    @Param('competitionId') competitionId: string,
    @Req() request: RequestWithHeaders,
    @Body(createChefPipe) dto: CreateChefDto,
  ) {
    return this.chefsService.create(request.headers, competitionId, dto);
  }

  @Patch('competitions/:competitionId/chefs/:userId')
  update(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(updateChefPipe) dto: UpdateChefDto,
  ) {
    return this.chefsService.update(
      request.headers,
      competitionId,
      userId,
      dto,
    );
  }

  @Patch('competitions/:competitionId/chefs/:userId/access')
  setAccess(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(setAccessPipe) dto: SetChefAccessDto,
  ) {
    return this.chefsService.setAccess(
      request.headers,
      competitionId,
      userId,
      dto.hasAccess,
    );
  }

  @Post('competitions/:competitionId/chefs/:userId/delete')
  remove(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(deleteChefPipe) dto: DeleteChefDto,
  ) {
    return this.chefsService.remove(
      request.headers,
      competitionId,
      userId,
      dto,
    );
  }

  @Post('competitions/:competitionId/chefs/:userId/reset-password')
  resetPassword(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Req() request: RequestWithHeaders,
    @Body(resetPasswordChefPipe) dto: ResetPasswordChefDto,
  ) {
    return this.chefsService.resetPassword(
      request.headers,
      competitionId,
      userId,
      dto,
    );
  }
}
