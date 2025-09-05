import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebinarDocument = Webinar & Document;

@Schema({ timestamps: true })
export class Webinar extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  presenter: string;

  // start date/time
  @Prop({ type: Date, required: true })
  startDate: Date;

  // duration in minutes
  @Prop({ type: Number, default: 0 })
  durationMinutes: number;

  // price (0 => free)
  @Prop({ type: Number, default: 0 })
  price: number;

  // status: upcoming | live | recorded
  @Prop({ type: String, enum: ['upcoming', 'live', 'recorded'], default: 'upcoming' })
  status: 'upcoming' | 'live' | 'recorded';

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  attendeesCount: number;

  // optional recorded video url
  @Prop()
  videoUrl?: string;

  // optional live stream url / key
  @Prop()
  streamUrl?: string;

  // thumbnail image url
  @Prop()
  thumbnail?: string;

  // agenda / topics
  @Prop({ type: [String], default: [] })
  agenda: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory' })
  subCategoryId: Types.ObjectId;

  // attendees: store user ids (optional)
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  attendees: Types.ObjectId[];
}

export const WebinarSchema = SchemaFactory.createForClass(Webinar);
