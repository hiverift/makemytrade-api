import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot,SlotSchema } from './entities/slot.schema';
import { Booking,BookingSchema } from './entities/booking.entity';
import { ServiceItem,ServiceItemSchema } from 'src/services/entities/service.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Slot.name, schema: SlotSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: ServiceItem.name, schema: ServiceItemSchema },
    ]),
  ],
  providers:[BookingsService],
  controllers:[BookingsController],
})
export class BookingsModule {}
