import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { UpdateCourseDto } from './dto/update-course.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { throwException } from 'src/util/errorhandling';
import { fileUpload } from 'src/util/fileupload';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
  ) {}

  async create(dto: CreateCourseDto, image?: Express.Multer.File) {
    try {
      const uploadedFileName = image ? fileUpload('courseImage', image) : null;
      console.log('uploadedFileName:', uploadedFileName);

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
      throwException(e);
    }
  }

  async findAll() {
    try {
      const courses = await this.courseModel.find().lean();
      return new CustomResponse(200, 'Courses fetched successfully', courses);
    } catch (e) {
      console.error('Course findAll error:', e);
      return new CustomError(500, 'Failed to fetch courses');
    }
  }

  async activCourses() {
    try {
      const count = await this.courseModel.countDocuments();
      return new CustomResponse(200, 'Active courses count fetched', { count });
    } catch (e) {
      console.error('Course activCourses error:', e);
      return new CustomError(500, 'Failed to fetch courses count');
    }
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid course ID');

      const course = await this.courseModel.findById(id);

      if (!course) return new CustomError(404, 'Course not found');
      return new CustomResponse(200, 'Course fetched successfully', course);
    } catch (e) {
      console.error('Course findById error:', e);
      return new CustomError(500, 'Failed to fetch course');
    }
  }

  async update(id: string, dto: UpdateCourseDto, image?: Express.Multer.File) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid course ID');

      // handle image upload
      let uploadedFileName: string | null = null;
      if (image) {
        uploadedFileName = fileUpload('courseImage', image);
      }

      const updateData: any = {
        ...dto,
      };

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
      console.error('Course remove error:', e);
      return new CustomError(500, 'Failed to delete course');
    }
  }

  async filterCourses(query: any) {
  try {
    const filter: any = {};

    // ✅ Allow filtering by multiple fields
    if (query.level) filter.level = query.level;
    if (query.mode) filter.mode = query.mode;
    if (query.itemType) filter.itemType = query.itemType;

    if (query.title) {
      filter.title = { $regex: query.title, $options: 'i' }; // case-insensitive search
    }

    if (query.instructor) {
      filter.instructor = { $regex: query.instructor, $options: 'i' };
    }

    const courses = await this.courseModel.find(filter).lean();

    return new CustomResponse(200, 'Filtered courses fetched successfully', courses);
  } catch (e) {
    console.error('Course filter error:', e);
    return new CustomError(500, 'Failed to filter courses');
  }
}

}
