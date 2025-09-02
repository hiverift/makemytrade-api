import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  mobile?: string;   // 👈 अब optional हुआ

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';
}
