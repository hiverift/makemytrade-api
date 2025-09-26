import {
  IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, ArrayNotEmpty, IsMongoId, Min
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateWebinarDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsString() @IsNotEmpty()
  presenter: string;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  status?: 'Upcoming' | 'Live' | 'Recorded';

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    // अगर value "2025-09-10 12:10" जैसे आया है
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
      return new Date(value.replace(' ', 'T') + ':00Z'); // => ISO में convert
    }
    return new Date(value); // otherwise normal parse
  })
  @Type(() => Date)
  startDate?: Date;

  @Transform(({ value }) => {
    if (!value) return [];
    try {
      return JSON.parse(value);  // 👉 "['Intro','Strategy']" को array में बदलेगा
    } catch {
      return Array.isArray(value) ? value : [value];
    }
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  agenda: string[];


  // @IsMongoId()
  // categoryId: string;

  // @IsOptional()
  // @IsMongoId()
  // subCategoryId?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;


  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsString()
  itemType: string;
}
