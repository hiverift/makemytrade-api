// src/modules/contact/entities/devine-automation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DevineAutomationEnquiryDocument = DevineAutomationEnquiry & Document;

@Schema({ timestamps: true })
export class DevineAutomationEnquiry {
  @Prop({ required: true })
  fullName: string;

  @Prop()
  companyName?: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  subject?: string;

  @Prop()
  message?: string;

  @Prop()
  serviceInterest?: string;

  @Prop({ default: 'devineautomation' })
  formType: string;
}

export const DevineAutomationEnquirySchema =
  SchemaFactory.createForClass(DevineAutomationEnquiry);
