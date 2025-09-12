import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post('addcategory')
  createCategory(@Body() dto: CreateCategoryDto) {
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

  @Put('updateCategory/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Put('updateSubCategory/:id')
  updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
    return this.service.updateSubCategory(id, dto);
  }

  @Delete('deleteCategory/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Delete('deleteSubCategoy/:id')
  deleteSubCategory(@Param('id') id: string) {
    return this.service.deleteSubCategory(id);
  }
}