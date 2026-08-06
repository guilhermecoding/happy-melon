import { Module } from '@nestjs/common';
import { PrintsController } from './prints.controller.js';
import { PrintsService } from './prints.service.js';

@Module({
  controllers: [PrintsController],
  providers: [PrintsService],
})
export class PrintsModule {}
