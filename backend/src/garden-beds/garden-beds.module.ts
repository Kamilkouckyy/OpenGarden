import { Module } from '@nestjs/common';
import { GardenBedsController } from './garden-beds.controller';
import { GardenBedsService } from './garden-beds.service';

@Module({
  controllers: [GardenBedsController],
  providers: [GardenBedsService],
  exports: [GardenBedsService],
})
export class GardenBedsModule {}
