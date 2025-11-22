// src/premium-groups/entities/premium-group-access.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PremiumGroupAccessDocument = PremiumGroupAccess & Document;

@Schema({ timestamps: true })
export class PremiumGroupAccess {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PremiumGroup', required: true })
  groupId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Number, required: true })
  durationHours: number;
}

export const PremiumGroupAccessSchema =
  SchemaFactory.createForClass(PremiumGroupAccess);
