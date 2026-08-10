import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { auth } from '../auth/auth.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { PrintsService } from './prints.service.js';
import {
  printTeamActionSchema,
  type PrintTeamActionDto,
} from './dto/print.dto.js';

const printTeamActionPipe = new ZodValidationPipe(printTeamActionSchema);

@Controller()
@Roles(['admin', 'staff'])
export class PrintsController {
  constructor(private readonly printsService: PrintsService) {}

  @Get('contests/:contestId/print-tasks')
  listByContest(
    @Param('contestId') contestId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.printsService.listByContest(contestId, teamId);
  }

  @Post('contests/:contestId/print-tasks/enqueue')
  enqueue(
    @Param('contestId') contestId: string,
    @Body(printTeamActionPipe) dto: PrintTeamActionDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.printsService.enqueue(contestId, dto, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/print-tasks/:taskId/confirm')
  confirm(
    @Param('contestId') contestId: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.printsService.confirm(contestId, taskId, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/print-tasks/:taskId/withhold')
  withhold(
    @Param('contestId') contestId: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.printsService.withhold(contestId, taskId, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/print-tasks/:taskId/claim')
  claim(
    @Param('contestId') contestId: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.printsService.claim(contestId, taskId, {
      userId: session.user.id,
      name: session.user.name,
    });
  }
}
