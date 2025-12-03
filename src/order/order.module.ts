import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';
import { PaymentsController } from 'src/payment/payment.controller';
import { Order,OrderSchema } from './entities/order.entity';

// Import modules that provide these services
import { UsersModule } from 'src/users/users.module';
import { CoursesModule } from 'src/courses/courses.module';
import { WebinarsModule } from 'src/webinar/webinar.module';
import { BookingsModule } from 'src/bookings/bookings.module';
import { PremiumGroupsModule } from 'src/premium-group/premium-group.module';
import { PremiumPlanModule } from 'src/premium-plan/premium-plan.module';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule,
    CoursesModule,
    WebinarsModule,
    BookingsModule,
    PremiumGroupsModule,
    PremiumPlanModule,
  ],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
