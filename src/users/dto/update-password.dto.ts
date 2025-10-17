import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateForgetpasswordDto {
  @IsNotEmpty()
  token: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;
}
