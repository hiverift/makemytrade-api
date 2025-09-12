import { IsMongoId, IsDateString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSlotDto {
  @IsMongoId() serviceId: string;
  @IsDateString() start: string;        // "2025-09-11T10:00:00Z" OR "2025-09-11 10:00"
  @IsDateString() end: string;
  @Type(()=>Number) @IsInt() @Min(1) capacity: number = 1;
  @IsOptional() @IsBoolean() active?: boolean = true;
}
