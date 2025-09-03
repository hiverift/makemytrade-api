import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Contact extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);