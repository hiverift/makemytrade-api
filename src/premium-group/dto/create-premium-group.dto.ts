// src/premium-groups/dto/create-premium-group.dto.ts
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePremiumGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  pricePerHour?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
