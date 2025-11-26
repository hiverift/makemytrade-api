// src/bookings/dto/update-slot.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateSlotDto {
  @IsOptional()
  @IsString()
  start?: string; // "YYYY-MM-DD HH:mm" ya ISO

  @IsOptional()
  @IsString()
  end?: string; // agar nahi doge to duration se auto calculate kar sakte ho (abhi manual)

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsNumber()
  seatsLeft?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
