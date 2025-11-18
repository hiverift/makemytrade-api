import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  mobile!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';  // 👈 string-based role

  @Prop({ type: Number, enum: [0, 1], default: 1 })
  userType!: number; // 👈 optional (0=admin, 1=user)

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash!: string | null;
  @Prop({ enum: ['active', 'expired', 'cancelled'], default: 'active' })
  status: string;

  @Prop({ default: false })
  onlineStatus: boolean;

  @Prop({ default: true })
  profileStatus: boolean;

  @Prop({ default: Date.now })
  lastSeen: Date;

  @Prop({ required: false })
  expiryDate: Date;

  @Prop({ required: false })
  username: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false })
  city: string;

  @Prop({ required: false })
  pincode: string;

  @Prop({ required: false })
  profilePicture: string;

  @Prop({ required: false })
  tokenHash!: string;

  @Prop({ type: String, default: null, select: false })
  passwordResetTokenHash!: string | null;

  @Prop({ type: Date, default: null })
  passwordResetTokenExpires!: Date | null;


}

export const UserSchema = SchemaFactory.createForClass(User);
