import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateForgetpasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
