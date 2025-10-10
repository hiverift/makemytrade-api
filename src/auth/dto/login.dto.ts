import { IsEmail, IsString,IsOptional,IsIn, MinLength } from 'class-validator';

export class LoginDto {
 @IsOptional()
  @IsEmail()
  email?: string;   // 👈 Optional email

  @IsOptional()
  @IsString()
  mobile?: string;  // 👈 Optional mobile

  @IsString()
  @MinLength(6)
  password: string;


  @IsOptional()
  @IsString()
  role?: 'user' | 'admin';

  expiryDate?: Date;
}
