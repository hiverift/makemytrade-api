import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { SubCategory } from './schemas/subcategory.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
  ) {}

  async createCategory(dto: CreateCategoryDto) {
    try {
      const category = new this.categoryModel(dto);
      await category.save();
      return new CustomResponse(201, 'Category created successfully', category);
    } catch (e) {
      return new CustomError(500, 'Failed to create category');
    }
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    try {
      const subCategory = new this.subCategoryModel(dto);
      await subCategory.save();
      return new CustomResponse(201, 'SubCategory created successfully', subCategory);
    } catch (e) {
      return new CustomError(500, 'Failed to create subcategory');
    }
  }

  async getAllCategories() {
    try {
      const categories = await this.categoryModel.find().lean();
      return new CustomResponse(200, 'Categories fetched successfully', categories);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch categories');
    }
  }

  async getSubCategoriesByCategory(categoryId: string) {
    try {
      const subs = await this.subCategoryModel.find({ categoryId }).lean();
      return new CustomResponse(200, 'SubCategories fetched successfully', subs);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch subcategories');
    }
  }
}
