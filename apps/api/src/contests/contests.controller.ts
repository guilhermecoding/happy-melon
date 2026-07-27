import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ContestsService } from './contests.service.js';
import {
  createContestSchema,
  updateContestSchema,
  type CreateContestDto,
  type UpdateContestDto,
} from './dto/contest.dto.js';

const createContestPipe = new ZodValidationPipe(createContestSchema);
const updateContestPipe = new ZodValidationPipe(updateContestSchema);

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(updateContestPipe) dto: UpdateContestDto,
  ) {
    return this.contestsService.update(id, dto);
  }
}
