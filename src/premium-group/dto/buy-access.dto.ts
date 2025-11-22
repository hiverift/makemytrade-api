// src/premium-groups/dto/buy-access.dto.ts
import { IsNumber, Min } from 'class-validator';

export class BuyAccessDto {
  @IsNumber()
  @Min(1)
  durationHours: number; // kitne ghante ka access
}
