import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ForgetPassword extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ForgetPasswordSchema = SchemaFactory.createForClass(ForgetPassword);
