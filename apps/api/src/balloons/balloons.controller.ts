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
import { BalloonsService } from './balloons.service.js';
import {
  teamQuestionActionSchema,
  type TeamQuestionActionDto,
} from './dto/balloon.dto.js';

const teamQuestionActionPipe = new ZodValidationPipe(teamQuestionActionSchema);

@Controller()
@Roles(['admin'])
export class BalloonsController {
  constructor(private readonly balloonsService: BalloonsService) {}

  @Get('contests/:contestId/balloon-deliveries')
  listByContest(
    @Param('contestId') contestId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.balloonsService.listByContest(contestId, teamId);
  }

  @Get('contests/:contestId/task-history')
  listTaskHistory(@Param('contestId') contestId: string) {
    return this.balloonsService.listTaskHistory(contestId);
  }

  @Post('contests/:contestId/balloon-deliveries/confirm')
  confirm(
    @Param('contestId') contestId: string,
    @Body(teamQuestionActionPipe) dto: TeamQuestionActionDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.confirm(contestId, dto, {
      userId: session.user.id,
      name: session.user.name,
    });
  }

  @Post('contests/:contestId/balloon-deliveries/withhold')
  withhold(
    @Param('contestId') contestId: string,
    @Body(teamQuestionActionPipe) dto: TeamQuestionActionDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.balloonsService.withhold(contestId, dto, {
      userId: session.user.id,
      name: session.user.name,
    });
  }
}
