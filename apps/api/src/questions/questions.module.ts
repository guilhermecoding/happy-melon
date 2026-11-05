import { Module } from '@nestjs/common';
import { BalloonColorsController } from './balloon-colors.controller.js';
import { BalloonColorsService } from './balloon-colors.service.js';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';

@Module({
  controllers: [QuestionsController, BalloonColorsController],
  providers: [QuestionsService, BalloonColorsService],
})
export class QuestionsModule {}
