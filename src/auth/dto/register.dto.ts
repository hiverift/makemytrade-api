export class CreateAuthDto {}
import { IsEmail, IsString, IsIn, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';   // 👈 अब optional
}
