// src/premium-groups/entities/premium-group.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PremiumGroupDocument = PremiumGroup & Document;

@Schema({ timestamps: true })
export class PremiumGroup {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number, default: 0 }) // price per hour (optional)
  pricePerHour: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const PremiumGroupSchema = SchemaFactory.createForClass(PremiumGroup);
