import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ServiceItem extends Document {
  @Prop({ required: true }) name: string;                       // Consultation (30 mins)
  @Prop({ default: '' })  description: string;
  @Prop({ required: true, min: 1 }) durationMinutes: number;     // 30, 60
  @Prop({ required: true, min: 0 }) price: number;               // 999
  @Prop({ default: true }) active: boolean;
  @Prop({ default: 0 }) order: number;                           // UI ordering
}
export const ServiceItemSchema = SchemaFactory.createForClass(ServiceItem);
