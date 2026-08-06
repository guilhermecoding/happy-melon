import { Module } from '@nestjs/common';
import { BalloonsController } from './balloons.controller.js';
import { BalloonsService } from './balloons.service.js';

@Module({
  controllers: [BalloonsController],
  providers: [BalloonsService],
})
export class BalloonsModule {}
