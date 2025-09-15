import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { UpdateCourseDto } from './dto/update-course.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { Category } from 'src/categories/schemas/category.schema';
import { SubCategory } from 'src/categories/schemas/subcategory.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { throwException } from 'src/util/errorhandling';
import { fileUpload } from 'src/util/fileupload';

@Injectable()
export class CoursesService {
    constructor(
        @InjectModel(Course.name) private courseModel: Model<Course>,
        @InjectModel(Category.name) private categoryModel: Model<Category>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    ) { }

    async create(dto: CreateCourseDto, image?: any) {
        try {


            if (!Types.ObjectId.isValid(dto.categoryId)) {
                return new CustomError(400, 'Invalid category ID');
            }
            const category = await this.categoryModel.findById(dto.categoryId);
            if (!category) return new CustomError(404, 'Category not found');

            // ✅ Validate subCategoryId
            if (dto.subCategoryId) {
                if (!Types.ObjectId.isValid(dto.subCategoryId)) {
                    return new CustomError(400, 'Invalid subCategory ID');
                }
                const subCategory = await this.subCategoryModel.findById(dto.subCategoryId);
                if (!subCategory) return new CustomError(404, 'SubCategory not found');

                // ensure subcategory belongs to given category
                if (String(subCategory.categoryId) !== String(dto.categoryId)) {
                    return new CustomError(400, 'SubCategory does not belong to given Category');
                }
            }

            const uploadedFileName = image
                ? fileUpload('courseImage', image)
                : null;
            console.log(uploadedFileName);

            const course = new this.courseModel({
                ...dto,
                image: uploadedFileName
                    ? `${process.env.SERVER_BASE_URL}uploads/courseImage/${uploadedFileName}`
                    : image,
            });

            await course.save();

            return new CustomResponse(201, 'Course created successfully', course);
        } catch (e) {
            console.error('Course create error:', e);
            throwException(e)
        }
    }

    async findAll() {
        try {
            const courses = await this.courseModel
                .find()
                .populate('categoryId')
                .populate('subCategoryId')
                .lean();
            return new CustomResponse(200, 'Courses fetched successfully', courses);
        } catch (e) {
            return new CustomError(500, 'Failed to fetch courses');
        }
    }

    async activCourses() {
        try {
            const courses = await this.courseModel.countDocuments().lean();
            return  courses;
        } catch (e) {
            return new CustomError(500, 'Failed to fetch courses');
        }
    }

    async findById(id: string) {
        try {
            if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid course ID');

            const course = await this.courseModel
                .findById(id)
                .populate('categoryId')
                .populate('subCategoryId');

            if (!course) return new CustomError(404, 'Course not found');
            return new CustomResponse(200, 'Course fetched successfully', course);
        } catch (e) {
            return new CustomError(500, 'Failed to fetch course');
        }
    }

    async findByCategory(categoryId: string) {
        try {
            if (!Types.ObjectId.isValid(categoryId)) return new CustomError(400, 'Invalid category ID');

            const category = await this.categoryModel.findById(categoryId);
            if (!category) return new CustomError(404, 'Category not found');

            const courses = await this.courseModel
                .find({ categoryId })
                .populate('subCategoryId')
                .lean();

            return new CustomResponse(200, 'Courses by category fetched successfully', courses);
        } catch (e) {
            return new CustomError(500, 'Failed to fetch category courses');
        }
    }
 
     async findBySubCategory(subCategoryId: string) {
  try {
    if (!Types.ObjectId.isValid(subCategoryId)) {
      return new CustomError(400, 'Invalid subCategory ID');
    }

    const subCategory = await this.subCategoryModel.findById(subCategoryId);
    if (!subCategory) return new CustomError(404, 'SubCategory not found');

    const courses = await this.courseModel
      .find({ subCategoryId })
      .populate('categoryId')
      .lean();

    return new CustomResponse(200, 'Courses by subCategory fetched successfully', courses);
  } catch (e) {
    console.error('Course findBySubCategory error:', e);
    return new CustomError(500, 'Failed to fetch subCategory courses');
  }
}

    async update(id: string, dto: UpdateCourseDto, image?: Express.Multer.File) {
        try {
            console.log(dto.title)
            if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid course ID');

            // ✅ validate category and subCategory if provided
            if (dto.categoryId) {
                const category = await this.categoryModel.findById(dto.categoryId);
                if (!category) return new CustomError(404, 'Category not found');
            }
            if (dto.subCategoryId) {
                const subCategory = await this.subCategoryModel.findById(dto.subCategoryId);
                if (!subCategory) return new CustomError(404, 'SubCategory not found');
            }

            // ✅ handle image upload
            let uploadedFileName: string | null = null;
            if (image) {
                uploadedFileName = fileUpload('courseImage', image);
            }

            const updateData: any = {
                ...dto,
            };
            console.log('hiiidine ondoe ', updateData)
            if (uploadedFileName) {
                updateData.image = `${process.env.SERVER_BASE_URL}uploads/courseImage/${uploadedFileName}`;
            }

            const course = await this.courseModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!course) return new CustomError(404, 'Course not found');

            return new CustomResponse(200, 'Course updated successfully', course);
        } catch (e) {
            console.error('Course update error:', e);
            return new CustomError(500, 'Failed to update course');
        }
    }


    async remove(id: string) {
        try {
            if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid course ID');

            const res = await this.courseModel.findByIdAndDelete(id);
            if (!res) return new CustomError(404, 'Course not found');

            return new CustomResponse(200, 'Course deleted successfully', { deleted: true });
        } catch (e) {
            return new CustomError(500, 'Failed to delete course');
        }
    }
}
