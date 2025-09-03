import { IsOptional, IsString, IsMongoId } from 'class-validator';

export class UpdateSubCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;
}