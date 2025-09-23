import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payment.service';
import { PaymentsController } from './payment.controller';
import { Payment,PaymentSchema } from './entities/payment.entity';
import { Booking,BookingSchema } from 'src/bookings/entities/booking.entity';
import { Slot,SlotSchema } from 'src/bookings/entities/slot.schema';
import { WebhookVerifier } from './webhook-verifier';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Slot.name, schema: SlotSchema },
      
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
