import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { QuestionsService } from './questions.service.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  type CreateQuestionDto,
  type UpdateQuestionDto,
} from './dto/question.dto.js';

const createQuestionPipe = new ZodValidationPipe(createQuestionSchema);
const updateQuestionPipe = new ZodValidationPipe(updateQuestionSchema);

@Controller()
@Roles(['admin'])
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('contests/:contestId/questions')
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
}
