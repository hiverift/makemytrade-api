import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YoutubeDocument = Youtube & Document;

@Schema({ timestamps: true })
export class Youtube {
  @Prop({ required: true })
  link: string;

  @Prop({ required: true, enum: ['course', 'webinar'] })
  category: string;

  @Prop({ required: true, enum: ['live', 'offline'] })
  type: string; // live / offline
}

export const YoutubeSchema = SchemaFactory.createForClass(Youtube);
