import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KycDocument = Kyc & Document;

@Schema()
export class Kyc {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  aadhaarFrontDoc: string; // Aadhaar front document path

  @Prop({ required: true })
  aadhaarBackDoc: string;  // Aadhaar back document path

  @Prop({ required: true })
  panFrontDoc: string;     // PAN front document path

  @Prop({ required: true })
  panBackDoc: string;      // PAN back document path

  @Prop({ required: true, enum: ['pending', 'under_review', 'verified', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  uploadedDate: Date;

  @Prop()
  remark: string;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);