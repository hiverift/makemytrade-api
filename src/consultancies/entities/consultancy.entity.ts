import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Consultancy extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  logo?: string; // image url

  @Prop({ type: String })
  headline?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [String], default: [] })
  expertise: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ type: [String], default: [] })
  contactOptions: string[]; // e.g. ["chat","call"]

  @Prop({ type: Date, default: null })
  nextAvailable?: Date;

  @Prop({ type: Number, default: 0 })
  consultationFee: number;

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @Prop({ type: Number, default: 0 })
  experienceYears: number;

  @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
  courses: Types.ObjectId[];
}

export const ConsultancySchema = SchemaFactory.createForClass(Consultancy);
