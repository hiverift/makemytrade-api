// src/premium-group/entities/premium-group-message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PremiumGroup } from 'src/premium-group/entities/premium-group.entity';

export type PremiumGroupMessageDocument = PremiumGroupMessage & Document;

@Schema({ timestamps: true })
export class Reaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  emoji: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

const ReactionSchema = SchemaFactory.createForClass(Reaction);

@Schema({ timestamps: true })
export class PremiumGroupMessage {
  @Prop({ type: Types.ObjectId, ref: PremiumGroup.name, required: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  userId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: false, default: null })
  adminId?: Types.ObjectId | null;

  @Prop({ type: String, enum: ['user', 'admin'], required: true })
  from: 'user' | 'admin';

  @Prop({ type: String, default: '' })
  text: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [ReactionSchema], default: [] })
  reactions: Reaction[];

  // 🔹 READ RECEIPTS: kin users ne message read kiya
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const PremiumGroupMessageSchema =
  SchemaFactory.createForClass(PremiumGroupMessage);
