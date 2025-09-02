export class CreateAuthDto {}
import { IsEmail, IsString,IsIn, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(6) password: string;
  @IsString() mobile:string;
   @IsString()
    @IsIn(['user', 'admin'])   // 👈 role भी पास करना होगा
    role: 'user' | 'admin';
}
