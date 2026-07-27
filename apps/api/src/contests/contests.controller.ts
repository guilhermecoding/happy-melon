import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.contestsService.findById(id);
  }

  @Post()
  create(@Body(createContestPipe) dto: CreateContestDto) {
    return this.contestsService.create(dto);
  }
}
