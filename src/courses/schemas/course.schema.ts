import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  instructor: string;

  @Prop()
  duration: string;

 @Prop({ required: true, type: Number })
price: number;

  @Prop({ enum: ['Beginner', 'Intermediate', 'Advanced'] })
  level: string;

  @Prop({ enum: ['Live', 'Recorded'], default: 'Recorded' })
  mode: string;

  @Prop()
  startDate: Date;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  studentsCount: number;

  @Prop()
  image: string;


  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory' })
  subCategoryId: Types.ObjectId;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
