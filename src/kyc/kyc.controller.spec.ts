import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KycDocument = Kyc & Document;

@Schema()
export class Kyc {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  aadhaarDoc: string; // Store file path or URL

  @Prop({ required: true })
  panDoc: string; // Store file path or URL

  @Prop({ required: true, enum: ['pending', 'under_review', 'verified', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  uploadedDate: Date;

  @Prop()
  remark: string;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);