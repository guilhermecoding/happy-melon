import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ContestsService } from './contests.service.js';
import {
  createContestSchema,
  type CreateContestDto,
} from './dto/contest.dto.js';

const createContestPipe = new ZodValidationPipe(createContestSchema);

@Controller('contests')
@Roles(['admin'])
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

  @Get()
  list() {
    return this.contestsService.list();
  }

  @Post()
  create(@Body(createContestPipe) dto: CreateContestDto) {
    return this.contestsService.create(dto);
  }
}
