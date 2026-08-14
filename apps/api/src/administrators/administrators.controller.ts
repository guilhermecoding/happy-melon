import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { IncomingHttpHeaders } from 'node:http';
import type { auth } from '../auth/auth.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AdministratorsService } from './administrators.service.js';
import {
  createAdministratorSchema,
  deleteAdministratorSchema,
  resetPasswordAdministratorSchema,
  setAccessSchema,
  updateAdministratorSchema,
  type CreateAdministratorDto,
  type DeleteAdministratorDto,
  type ResetPasswordAdministratorDto,
  type SetAccessDto,
  type UpdateAdministratorDto,
} from './dto/administrator.dto.js';

type RequestWithHeaders = { headers: IncomingHttpHeaders };

const createAdministratorPipe = new ZodValidationPipe(createAdministratorSchema);
const updateAdministratorPipe = new ZodValidationPipe(updateAdministratorSchema);
const setAccessPipe = new ZodValidationPipe(setAccessSchema);
const deleteAdministratorPipe = new ZodValidationPipe(deleteAdministratorSchema);
const resetPasswordAdministratorPipe = new ZodValidationPipe(
  resetPasswordAdministratorSchema,
);

@Controller('administrators')
@Roles(['admin'])
export class AdministratorsController {
  constructor(
    private readonly administratorsService: AdministratorsService,
  ) {}

  @Get()
  list(@Req() request: RequestWithHeaders) {
    return this.administratorsService.list(request.headers);
  }

  @Post()
  create(
    @Req() request: RequestWithHeaders,
    @Body(createAdministratorPipe) dto: CreateAdministratorDto,
  ) {
    return this.administratorsService.create(request.headers, dto);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(updateAdministratorPipe) dto: UpdateAdministratorDto,
  ) {
    return this.administratorsService.update(request.headers, id, dto);
  }

  @Patch(':id/access')
  setAccess(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(setAccessPipe) dto: SetAccessDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.administratorsService.setAccess(
      request.headers,
      id,
      dto.hasAccess,
      session.user.id,
    );
  }

  @Post(':id/delete')
  remove(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(deleteAdministratorPipe) dto: DeleteAdministratorDto,
    @Session() session: UserSession<typeof auth>,
  ) {
    return this.administratorsService.remove(
      request.headers,
      id,
      dto,
      session.user.id,
    );
  }

  @Post(':id/reset-password')
  resetPassword(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body(resetPasswordAdministratorPipe) dto: ResetPasswordAdministratorDto,
  ) {
    return this.administratorsService.resetPassword(
      request.headers,
      id,
      dto,
    );
  }
}
