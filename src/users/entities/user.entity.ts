// If your file is src/users/entities/user.entity.ts OR src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  // 👇 Explicitly declare the type to avoid CannotDetermineTypeError
  @Prop({ type: String, default: null, select: false })
  refreshTokenHash!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
