import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { BalloonColorsService } from './balloon-colors.service.js';
import {
  balloonColorInputSchema,
  type BalloonColorInput,
} from './dto/balloon-color.dto.js';

const balloonColorInputPipe = new ZodValidationPipe(balloonColorInputSchema);

@Controller('balloon-colors')
@Roles(['admin'])
export class BalloonColorsController {
  constructor(private readonly balloonColors: BalloonColorsService) {}

  @Get()
  list() {
    return this.balloonColors.list();
  }

  @Post()
  create(@Body(balloonColorInputPipe) dto: BalloonColorInput) {
    return this.balloonColors.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(balloonColorInputPipe) dto: BalloonColorInput,
  ) {
    return this.balloonColors.update(id, dto);
  }

  @Post(':id/delete')
  remove(@Param('id') id: string) {
    return this.balloonColors.remove(id);
  }
}
