// src/order/entities/order.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  CREATED = 'created',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Schema({ _id: false })
export class PaymentInfo {
  @Prop({ type: String, required: false })
  razorpayOrderId?: string;

  @Prop({ type: String, required: false })
  razorpayPaymentId?: string;

  @Prop({ type: String, required: false })
  razorpaySignature?: string;

  @Prop({ type: String, required: false })
  status?: string;

  // amount in paise
  @Prop({ type: Number, required: false })
  capturedAmount?: number;

  @Prop({ type: String, required: false })
  currency?: string;
  @Prop({ type: String, required: false })
  ChatId?: string;
  // <= HERE: explicitly tell Mongoose it's an object (free-form notes)
  @Prop({ type: Object, required: false, default: {} })
  notes?: Record<string, any>;
}

export const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ required: false })
  userId?: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  orderId?: string;

  @Prop({ type: String, required: false })
  courseId?: string;

  @Prop({ type: String, required: false })
  webinarId?: string;

  @Prop({ type: String, required: false })
  appointmentId?: string;
  
  @Prop({ type: String, required: false })
  ChatId?: string;

  @Prop({ type: String, enum: ['course', 'webinar', 'appointment'], required: false })
  itemType?: string;

  // amount stored in paise
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true, default: 'INR' })
  currency: string;

  // use explicit enum string type
  @Prop({ type: String, enum: Object.values(OrderStatus), default: OrderStatus.CREATED })
  status: OrderStatus;

  // store payment as a nested object of known schema
  @Prop({ type: PaymentInfoSchema, required: false, default: {} })
  payment?: PaymentInfo;

  // meta can be any free-form object
  @Prop({ type: Object, required: false, default: {} })
  meta?: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
