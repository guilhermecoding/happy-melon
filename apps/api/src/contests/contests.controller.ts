import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { map, type Observable } from 'rxjs';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ContestAccessEventsService } from './contest-access.events.js';
import { ContestsService } from './contests.service.js';
import {
  createContestSchema,
  staffSettingsSchema,
  updateContestSchema,
  type CreateContestDto,
  type StaffSettingsDto,
  type UpdateContestDto,
} from './dto/contest.dto.js';

const createContestPipe = new ZodValidationPipe(createContestSchema);
const updateContestPipe = new ZodValidationPipe(updateContestSchema);
const staffSettingsPipe = new ZodValidationPipe(staffSettingsSchema);

@Controller('contests')
@Roles(['admin'])
export class ContestsController {
  constructor(
    private readonly contestsService: ContestsService,
    private readonly contestAccessEvents: ContestAccessEventsService,
  ) {}

  @Get()
  list() {
    return this.contestsService.list();
  }

  @Get(':id')
  @Roles(['admin', 'staff'])
  findById(@Param('id') id: string) {
    return this.contestsService.findById(id);
  }

  @Sse(':id/access/events')
  @Roles(['admin', 'staff'])
  streamAccessEvents(
    @Param('id') contestId: string,
  ): Observable<MessageEvent> {
    return this.contestAccessEvents.subscribe(contestId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  @Post()
  create(@Body(createContestPipe) dto: CreateContestDto) {
    return this.contestsService.create(dto);
  }

  @Patch(':id/staff-settings')
  updateStaffSettings(
    @Param('id') id: string,
    @Body(staffSettingsPipe) dto: StaffSettingsDto,
  ) {
    return this.contestsService.updateStaffSettings(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(updateContestPipe) dto: UpdateContestDto,
  ) {
    return this.contestsService.update(id, dto);
  }
}
