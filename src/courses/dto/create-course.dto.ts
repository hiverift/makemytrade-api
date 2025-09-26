import { IsString, IsNotEmpty, IsMongoId, IsNumber, IsOptional, ArrayNotEmpty, IsArray } from 'class-validator';

export class CreateCourseDto {


  @IsString() @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsString()
  instructor: string;

  @IsString()
  duration: string;

  @IsString()
  price: string;

  @IsString()
  level: string;

  @IsString()
  mode: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  rating?: number;

  @IsOptional()
  studentsCount?: number;

  @IsOptional()
  image: string;

  @IsString()
  itemType: string;

  // @IsOptional()
  // @IsMongoId()
  // subCategoryId?: string;
}
