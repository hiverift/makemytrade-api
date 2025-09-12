import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingStatus = 'pending'|'paid'|'cancelled'|'failed';

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ type: Types.ObjectId, ref:'ServiceItem', required: true }) serviceId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref:'Slot', required: true }) slotId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref:'User', required: false }) userId?: Types.ObjectId;

  @Prop({ type: Number, required: true }) amount: number;          // price locked at time of booking
  @Prop({ type: String, default: 'pending' }) status: BookingStatus;
  @Prop({ type: String, default: null }) paymentRef?: string;      // txn/order id
  @Prop({ type: String, default: null }) paymentMethod?: string;   // card/upi/mock
}
export const BookingSchema = SchemaFactory.createForClass(Booking);
