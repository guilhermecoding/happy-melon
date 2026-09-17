import { Module } from '@nestjs/common';
import { ChefsController } from './chefs.controller.js';
import { ChefsService } from './chefs.service.js';

@Module({
  controllers: [ChefsController],
  providers: [ChefsService],
})
export class ChefsModule {}
