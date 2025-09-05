import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webinar } from './entities/webinar.entity';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { UpdateWebinarDto } from './dto/update-webinar.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { Category } from 'src/categories/schemas/category.schema';
import { SubCategory } from 'src/categories/schemas/subcategory.schema';
import { fileUpload } from 'src/util/fileupload';

@Injectable()
export class WebinarsService {
  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
  ) {}

  private buildThumbUrl(filename?: string) {
    if (!filename) return null;
    const base = process.env.SERVER_BASE_URL?.replace(/\/$/, '') ?? '';
    return `${base}/uploads/courseImage/${filename}`; // reuse same folder
  }

  async create(dto: CreateWebinarDto, thumbnail?: Express.Multer.File) {
    try {
      if (!Types.ObjectId.isValid(dto.categoryId)) return new CustomError(400, 'Invalid category ID');
      const cat = await this.categoryModel.findById(dto.categoryId);
      if (!cat) return new CustomError(404, 'Category not found');

      if (dto.subCategoryId) {
        if (!Types.ObjectId.isValid(dto.subCategoryId)) return new CustomError(400, 'Invalid subCategory ID');
        const sub = await this.subCategoryModel.findById(dto.subCategoryId);
        if (!sub) return new CustomError(404, 'SubCategory not found');
        if (String(sub.categoryId) !== String(dto.categoryId)) return new CustomError(400, 'SubCategory does not belong to Category');
      }


      
       const uploadedFileName = thumbnail
                ? fileUpload('webniar', thumbnail)
                : null;
            console.log(uploadedFileName);
      
      const doc: any = {
        ...dto,
        thumbnail:uploadedFileName
                    ? `${process.env.SERVER_BASE_URL}uploads/webinar/${uploadedFileName}`
                    : thumbnail,
        categoryId: new Types.ObjectId(dto.categoryId),
        subCategoryId: dto.subCategoryId ? new Types.ObjectId(dto.subCategoryId) : undefined,
      };

      

      const webinar = new this.webinarModel(doc);
      await webinar.save();
      return new CustomResponse(201, 'Webinar created successfully', webinar);
    } catch (e) {
      console.error('Webinar create error:', e);
      return new CustomError(500, e.message || 'Failed to create webinar');
    }
  }

  async findAll() {
    try {
      const items = await this.webinarModel.find().populate('categoryId').populate('subCategoryId').lean();
      return new CustomResponse(200, 'Webinars fetched successfully', items);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch webinars');
    }
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid webinar ID');
      const item = await this.webinarModel.findById(id).populate('categoryId').populate('subCategoryId');
      if (!item) return new CustomError(404, 'Webinar not found');
      return new CustomResponse(200, 'Webinar fetched successfully', item);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch webinar');
    }
  }

  async findByStatus(status: 'upcoming' | 'live' | 'recorded') {
    try {
      const items = await this.webinarModel.find({ status }).populate('categoryId').populate('subCategoryId').lean();
      return new CustomResponse(200, `Webinars (${status}) fetched`, items);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch webinars');
    }
  }

  async findByCategory(categoryId: string) {
    try {
      if (!Types.ObjectId.isValid(categoryId)) return new CustomError(400, 'Invalid category ID');
      const cat = await this.categoryModel.findById(categoryId);
      if (!cat) return new CustomError(404, 'Category not found');
      const items = await this.webinarModel.find({ categoryId }).populate('subCategoryId').lean();
      return new CustomResponse(200, 'Webinars by category fetched', items);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch webinars by category');
    }
  }

  async findBySubCategory(subCategoryId: string) {
    try {
      if (!Types.ObjectId.isValid(subCategoryId)) return new CustomError(400, 'Invalid subCategory ID');
      const sub = await this.subCategoryModel.findById(subCategoryId);
      if (!sub) return new CustomError(404, 'SubCategory not found');
      const items = await this.webinarModel.find({ subCategoryId }).populate('categoryId').lean();
      return new CustomResponse(200, 'Webinars by subCategory fetched', items);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch webinars by subCategory');
    }
  }

  async update(id: string, dto: UpdateWebinarDto, thumbnail?: Express.Multer.File) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid webinar ID');

      if (dto.categoryId) {
        if (!Types.ObjectId.isValid(dto.categoryId)) return new CustomError(400, 'Invalid category ID');
        const c = await this.categoryModel.findById(dto.categoryId);
        if (!c) return new CustomError(404, 'Category not found');
      }
      if (dto.subCategoryId) {
        if (!Types.ObjectId.isValid(dto.subCategoryId)) return new CustomError(400, 'Invalid subCategory ID');
        const s = await this.subCategoryModel.findById(dto.subCategoryId);
        if (!s) return new CustomError(404, 'SubCategory not found');
      }



       const uploadedFileName = thumbnail
                ? fileUpload('webniar', thumbnail)
                : null;
            console.log(uploadedFileName);
      
      const doc: any = {
        ...dto,
        thumbnail:uploadedFileName
                    ? `${process.env.SERVER_BASE_URL}uploads/webinar/${uploadedFileName}`
                    : thumbnail,
        categoryId: new Types.ObjectId(dto.categoryId),
        subCategoryId: dto.subCategoryId ? new Types.ObjectId(dto.subCategoryId) : undefined,
      };
      if (dto.categoryId) doc.categoryId = new Types.ObjectId(dto.categoryId);
      if (dto.subCategoryId) doc.subCategoryId = new Types.ObjectId(dto.subCategoryId);

  
      
       
    
       
      

      const webinar = await this.webinarModel.findByIdAndUpdate(id, doc, { new: true });
      if (!webinar) return new CustomError(404, 'Webinar not found');
      return new CustomResponse(200, 'Webinar updated successfully', webinar);
    } catch (e) {
      console.error('Webinar update error:', e);
      return new CustomError(500, 'Failed to update webinar');
    }
  }

  async remove(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid webinar ID');
      const res = await this.webinarModel.findByIdAndDelete(id);
      if (!res) return new CustomError(404, 'Webinar not found');
      return new CustomResponse(200, 'Webinar deleted successfully', { deleted: true });
    } catch (e) {
      return new CustomError(500, 'Failed to delete webinar');
    }
  }

  // register a user (attend) — userId should be validated by caller (or pass via CurrentUser)
  async registerAttendee(webinarId: string, userId: string) {
    try {
      if (!Types.ObjectId.isValid(webinarId) || !Types.ObjectId.isValid(userId)) return new CustomError(400, 'Invalid IDs');

      const webinar = await this.webinarModel.findById(webinarId).select('+attendees');
      if (!webinar) return new CustomError(404, 'Webinar not found');

      const uid = new Types.ObjectId(userId);
      const exists = (webinar.attendees || []).some(a => String(a) === String(uid));
      if (exists) return new CustomError(400, 'Already registered');

      webinar.attendees.push(uid);
      webinar.attendeesCount = (webinar.attendeesCount || 0) + 1;
      await webinar.save();

      return new CustomResponse(200, 'Registered successfully', { webinarId, userId });
    } catch (e) {
      console.error('Register attendee error:', e);
      return new CustomError(500, 'Failed to register attendee');
    }
  }

  // return live stream url (if authorized)
  async getLiveDetails(webinarId: string) {
    try {
      if (!Types.ObjectId.isValid(webinarId)) return new CustomError(400, 'Invalid webinar ID');
      const w = await this.webinarModel.findById(webinarId).select('streamUrl status');
      if (!w) return new CustomError(404, 'Webinar not found');
      if (w.status !== 'live') return new CustomError(400, 'Webinar not live currently');
      return new CustomResponse(200, 'Live details', { streamUrl: w.streamUrl });
    } catch (e) {
      return new CustomError(500, 'Failed to get live details');
    }
  }
}
