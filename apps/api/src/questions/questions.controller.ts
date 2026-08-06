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
import { QuestionsService } from './questions.service.js';
import {
  createQuestionSchema,
  deleteQuestionSchema,
  updateQuestionSchema,
  type CreateQuestionDto,
  type DeleteQuestionDto,
  type UpdateQuestionDto,
} from './dto/question.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createQuestionPipe = new ZodValidationPipe(createQuestionSchema);
const updateQuestionPipe = new ZodValidationPipe(updateQuestionSchema);
const deleteQuestionPipe = new ZodValidationPipe(deleteQuestionSchema);

@Controller()
@Roles(['admin'])
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('contests/:contestId/questions')
  @Roles(['admin', 'staff'])
  listByContest(@Param('contestId') contestId: string) {
    return this.questionsService.listByContest(contestId);
  }

  @Post('contests/:contestId/questions')
  create(
    @Param('contestId') contestId: string,
    @Body(createQuestionPipe) dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(contestId, dto);
  }

  @Patch('questions/:id')
  update(
    @Param('id') id: string,
    @Body(updateQuestionPipe) dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, dto);
  }

  @Post('questions/:id/delete')
  remove(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(deleteQuestionPipe) dto: DeleteQuestionDto,
  ) {
    return this.questionsService.remove(request.headers, id, dto);
  }
}
