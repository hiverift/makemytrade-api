import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PremiumGroup } from './premium-group.entity';
import { PremiumPlan } from './premium-plan.schema';

export type PremiumGroupAccessDocument = PremiumGroupAccess & Document;

@Schema({ timestamps: true })
export class PremiumGroupAccess {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: PremiumGroup.name, required: true })
  groupId: Types.ObjectId;

  // ✅ user ne kaun sa plan liya
  @Prop({ type: Types.ObjectId, ref: PremiumPlan.name, required: false })
  planId?: Types.ObjectId;

  // ✅ plan ke hisab se kitna amount gaya (discount vs offer ho to override bhi ho sakta)
  @Prop({ type: Number, required: false })
  amountPaid?: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  // ✅ plan ki duration kitni (backup + history)
  @Prop({ type: Number, required: true })
  durationHours: number;

  // ✅ access kab tak valid hai (ChatScreen me ye hi ja raha hai)
  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PremiumGroupAccessSchema =
  SchemaFactory.createForClass(PremiumGroupAccess);
