import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Slot extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ServiceItem', required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Date, required: true }) start: Date;      // slot start
  @Prop({ type: Date, required: true }) end: Date;        // start + duration
  @Prop({ type: Number, default: 1 }) capacity: number;   // seats
  @Prop({ type: Number, default: 1 }) seatsLeft: number;  // decremented on booking
  @Prop({ default: true }) active: boolean;
}
export const SlotSchema = SchemaFactory.createForClass(Slot);
