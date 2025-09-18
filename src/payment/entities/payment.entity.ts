import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop()
  bookingId?:string;

  @Prop({ type: String })
  provider: string; // e.g. 'razorpay'

  @Prop()
  courseId?: string; // Course ID if the order is for a course

  @Prop()
  webinarId?: string; // Webinar ID if the order is for a webinar

  @Prop({ type: String })
  orderId?: string;

  @Prop({ type: String })
  paymentId?: string;

  @Prop({ type: String })
  signature?: string;

  @Prop({ type: Number })
  amount?: number; // in paise or INR (we'll store paise for safety)

  @Prop({ type: String, enum: ['created','captured','failed'], default: 'created' })
  status?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
