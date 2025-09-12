import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceItem', required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slotId: Types.ObjectId;

  @Prop({ type: String })
  paymentRef?: string;

  @Prop({ type: String, enum: ['pending','paid','cancelled'], default: 'pending' })
  status?: string;

  @Prop({ type: Number, default: 0 })
  amount?: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
