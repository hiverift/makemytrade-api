import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post('addcategory')
  createCategory(@Body() dto: CreateCategoryDto) {
    console.log(dto);
    return this.service.createCategory(dto);
  }

  @Post('subcategory')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.service.createSubCategory(dto);
  }

  @Get()
  getAllCategories() {
    return this.service.getAllCategories();
  }

  @Get(':id/subcategories')
  getSubCategories(@Param('id') categoryId: string) {
    return this.service.getSubCategoriesByCategory(categoryId);
  }
}
