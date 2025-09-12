import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Faq extends Document {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  order: number; // for ordering in UI / admin

  @Prop({ default: 0 })
  views: number;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
