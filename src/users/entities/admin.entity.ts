// src/users/schemas/admin.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name?: string;

  // store Google OAuth tokens (refresh token must be persisted)
  @Prop({ type: Object, default: null, select: false })
  googleOauthTokens?: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
  } | null;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
