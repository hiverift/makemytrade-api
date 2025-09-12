import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaqDto {
  @IsString() @IsNotEmpty()
  question: string;

  @IsString() @IsNotEmpty()
  answer: string;

  @IsOptional() @IsBoolean()
  active?: boolean = true;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number = 0;
}
