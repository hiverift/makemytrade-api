import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PremiumGroup } from './premium-group.entity';

export type PremiumPlanDocument = PremiumPlan & Document;

@Schema({ timestamps: true })
export class PremiumPlan {
  @Prop({ type: Types.ObjectId, ref: PremiumGroup.name, required: true })
  groupId: Types.ObjectId;

  @Prop({ required: true })
  name: string; // e.g. "1 Day Plan", "7 Days Plan"

  @Prop({ required: true })
  description: string; // e.g. "Access for 24 hours"

  @Prop({ type: Number, required: true })
  amount: number; // INR me amount

  @Prop({ type: String, default: 'INR' })
  currency: string;

  @Prop({ type: Number, required: true })
  durationHours: number; // plan kitne hours ka hai (24, 168, 720, etc.)

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PremiumPlanSchema = SchemaFactory.createForClass(PremiumPlan);
