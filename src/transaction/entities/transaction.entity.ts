import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction {
  @Prop({ required: true })
  paymentId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);