
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class DevineAutomationContactDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(160)
  emailAddress: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceInterest?: string;   // ex: Accounting Automation
}
