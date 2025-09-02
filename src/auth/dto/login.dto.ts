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

   @IsString()
  @IsIn(['user', 'admin'])   // 👈 role भी पास करना होगा
  role: 'user' | 'admin';
}
