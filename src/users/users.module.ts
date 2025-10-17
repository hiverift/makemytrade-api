
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User,UserSchema } from './entities/user.entity';
import { Webinar,WebinarSchema } from 'src/webinar/entities/webinar.entity';
import { Course,CourseSchema } from 'src/courses/schemas/course.schema';
import { Booking,BookingSchema } from 'src/bookings/entities/booking.entity';
import { Order,OrderSchema } from 'src/order/entities/order.entity';
import { ForgetPassword, ForgetPasswordSchema } from './entities/password-forgot.entity';

@Module({
 imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
       { name: ForgetPassword.name, schema: ForgetPasswordSchema },
      { name: Webinar.name, schema: WebinarSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
