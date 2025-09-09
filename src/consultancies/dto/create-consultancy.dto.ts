
import { IsString, IsOptional, IsArray, IsNumber, Min, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateConsultancyDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  headline?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value.split(',').map((s: string)=>s.trim()); }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  expertise?: string[] = [];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value.split(',').map((s: string)=>s.trim()); }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  languages?: string[] = [];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value.split(',').map((s: string)=>s.trim()); }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  contactOptions?: string[] = [];

  @IsOptional()
  @IsDateString()
  nextAvailable?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return [value]; }
    }
    return value;
  })
  @IsArray()
  courses?: string[] = [];
}
