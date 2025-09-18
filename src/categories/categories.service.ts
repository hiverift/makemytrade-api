import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { SubCategory } from './schemas/subcategory.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
  ) { }

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
      if (!Types.ObjectId.isValid(dto.categoryId)) {
        return new CustomError(400, 'Invalid category ID');
      }
      const category = await this.categoryModel.findById(dto.categoryId);
      if (!category) {
        return new CustomError(404, 'Category not found');
      }
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
      if (!Types.ObjectId.isValid(categoryId)) {
        return new CustomError(400, 'Invalid category ID');
      }
      const category = await this.categoryModel.findById(categoryId);
      if (!category) {
        return new CustomError(404, 'Category not found');
      }
      const subs = await this.subCategoryModel.find({ categoryId }).lean();
      return new CustomResponse(200, 'SubCategories fetched successfully', subs);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch subcategories');
    }
  }

  async getAllSubcategory() {
    try {

      const subs = await this.subCategoryModel.find().lean();
      return new CustomResponse(200, 'All SubCategories fetched successfully', subs);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch subcategories');
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return new CustomError(400, 'Invalid category ID');
      }
      const category = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
      if (!category) {
        return new CustomError(404, 'Category not found');
      }
      return new CustomResponse(200, 'Category updated successfully', category);
    } catch (e) {
      return new CustomError(500, 'Failed to update category');
    }
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return new CustomError(400, 'Invalid subcategory ID');
      }
      if (dto.categoryId && !Types.ObjectId.isValid(dto.categoryId)) {
        return new CustomError(400, 'Invalid category ID');
      }
      if (dto.categoryId) {
        const category = await this.categoryModel.findById(dto.categoryId);
        if (!category) {
          return new CustomError(404, 'Category not found');
        }
      }
      const subCategory = await this.subCategoryModel.findByIdAndUpdate(id, dto, { new: true });
      if (!subCategory) {
        return new CustomError(404, 'SubCategory not found');
      }
      return new CustomResponse(200, 'SubCategory updated successfully', subCategory);
    } catch (e) {
      return new CustomError(500, 'Failed to update subcategory');
    }
  }

  async deleteCategory(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return new CustomError(400, 'Invalid category ID');
      }
      const category = await this.categoryModel.findById(id);
      if (!category) {
        return new CustomError(404, 'Category not found');
      }
      const subCategories = await this.subCategoryModel.find({ categoryId: id });
      if (subCategories.length > 0) {
        return new CustomError(400, 'Cannot delete category with associated subcategories');
      }
      await this.categoryModel.findByIdAndDelete(id);
      return new CustomResponse(200, 'Category deleted successfully', { deleted: true });
    } catch (e) {
      return new CustomError(500, 'Failed to delete category');
    }
  }

  async deleteSubCategory(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return new CustomError(400, 'Invalid subcategory ID');
      }
      const subCategory = await this.subCategoryModel.findById(id);
      if (!subCategory) {
        return new CustomError(404, 'SubCategory not found');
      }
      await this.subCategoryModel.findByIdAndDelete(id);
      return new CustomResponse(200, 'SubCategory deleted successfully', { deleted: true });
    } catch (e) {
      return new CustomError(500, 'Failed to delete subcategory');
    }
  }
}