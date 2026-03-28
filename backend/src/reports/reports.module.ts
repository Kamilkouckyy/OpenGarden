import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [EquipmentModule, TasksModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
