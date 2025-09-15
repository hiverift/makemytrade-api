import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard-service.controller';
import { DashboardService } from './dashboard-service.service';
import { Dashboard,DashboardSchema } from './entities/dashboard-service.entity';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dashboard.name, schema: DashboardSchema }]),
    UsersModule,
    CoursesModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardServiceModule {}