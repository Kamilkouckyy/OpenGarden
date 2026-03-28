import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { GardenBedsModule } from './garden-beds/garden-beds.module';
import { TasksModule } from './tasks/tasks.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ReportsModule } from './reports/reports.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    GardenBedsModule,
    TasksModule,
    EquipmentModule,
    ReportsModule,
    EventsModule,
  ],
})
export class AppModule {}
