import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  [x: string]: any;
  _id: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true, index: true })
  receiverId: string;

  @Prop({ required: true, index: true })
  chatId: string;

  @Prop({ required: false })
  text?: string;

  @Prop({ required: false })
  mediaUrl?: string[];

  @Prop({ required: false })
  mediaType?: string;

  @Prop({ required: false })
  caption?: string;

  @Prop([String]) // Changed to array
  document_titles: string[];

  @Prop([String]) // Changed to array
  document_sizes: string[];

  @Prop([String]) // Changed to array
  document_pages: string[];

  @Prop({ enum: ['text', 'media'], required: true })
  messageType: string;

  @Prop({ enum: ['sent', 'delivered', 'read', 'pending'], default: 'sent' })
  status: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Custom validation
MessageSchema.pre('validate', function (next) {
  if (!this.text && !this.mediaUrl) {
    next(new Error('At least one of text or mediaUrl is required'));
  }
  next();
});

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

// Remove __v from toObject
MessageSchema.set('toObject', { versionKey: false });