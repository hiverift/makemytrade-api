import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Enquiry extends Document {
  @Prop({ default: 'rightpricepumps' })
  formType: string;
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, enum: ['buying', 'selling', 'both', 'investing'] })
  goal: string;

  @Prop({ enum: ['first', 'second'], default: null })
  firstHouse?: string;

  @Prop({
    enum: [
      'under-300k',
      '300k-400k',
      '400k-500k',
      '500k-700k',
      '700k-1m',
      'over-1m',
    ],
  })
  budget?: string;

  @Prop({
    enum: ['asap', '1-3-months', '3-6-months', '6-plus', 'just-looking'],
  })
  timeline?: string;

  @Prop({ required: true })
  location: string;

  @Prop({
    enum: [
      'house',
      'duplex',
      'triplex',
      'apartment-1br',
      'apartment-2br',
      'apartment-3br',
      'condominium',
      'townhouse',
      'land',
    ],
  })
  propertyType?: string;

  @Prop()
  additionalInfo?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);

// Ensure either email or phone is present
EnquirySchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    return next(new Error('Either email or phone must be provided'));
  }
  next();
});
