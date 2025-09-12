import { IsMongoId, IsDateString, IsInt, Min, IsOptional, IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class BulkSlotsDto {
  @IsMongoId()
  serviceId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number = 1;

  // NEW: times can be sent as array OR JSON-string OR comma-separated string
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return ('' + value).split(',').map((s: string) => s.trim()).filter(Boolean);
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  times: string[];
}
