import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @Type(()=>Number) @IsNumber() @Min(1) durationMinutes: number;
  @Type(()=>Number) @IsNumber() @Min(0) price: number;
  @IsOptional() @IsBoolean() active?: boolean = true;
  @IsOptional() @Type(()=>Number) @IsInt() order?: number = 0;
}
