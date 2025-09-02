import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsIn(['user', 'admin']) role?: 'user' | 'admin';
}
