import { Module } from '@nestjs/common';
import { GardenBedsController } from './garden-beds.controller';
import { GardenBedsService } from './garden-beds.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GardenBedsController],
  providers: [GardenBedsService],
  exports: [GardenBedsService],
})
export class GardenBedsModule {}
