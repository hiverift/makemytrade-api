import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webinar } from './entities/webinar.entity';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { UpdateWebinarDto } from './dto/update-webinar.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { fileUpload } from 'src/util/fileupload';

@Injectable()
export class WebinarsService {
  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
  ) { }

  private buildThumbUrl(filename?: string) {
    if (!filename) return null;
    const base = process.env.SERVER_BASE_URL?.replace(/\/$/, '') ?? '';
    return `${base}/uploads/webinar/${filename}`;
  }

  async create(dto: CreateWebinarDto, thumbnail?: Express.Multer.File) {
    try {
      const uploadedFileName = thumbnail ? fileUpload('webniar', thumbnail) : null;
      console.log('uploadedFileName:', uploadedFileName);

      const doc: any = {
        ...dto,
        thumbnail: uploadedFileName
          ? `${process.env.SERVER_BASE_URL}uploads/webinar/${uploadedFileName}`
          : thumbnail,
      };

      // keep DTO fields as-is (no category/subcategory validation)
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
      const items = await this.webinarModel.find().lean();
      return new CustomResponse(200, 'Webinars fetched successfully', items);
    } catch (e) {
      console.error('Webinar findAll error:', e);
      return new CustomError(500, 'Failed to fetch webinars');
    }
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid webinar ID');
      const item = await this.webinarModel.findById(id);
      if (!item) return new CustomError(404, 'Webinar not found');
      return new CustomResponse(200, 'Webinar fetched successfully', item);
    } catch (e) {
      console.error('Webinar findById error:', e);
      return new CustomError(500, 'Failed to fetch webinar');
    }
  }

  async findByStatus(status: 'Upcoming' | 'Live' | 'Recorded') {
    try {
      const items = await this.webinarModel.find({ status }).lean();
      return new CustomResponse(200, `Webinars (${status}) fetched`, items);
    } catch (e) {
      console.error('Webinar findByStatus error:', e);
      return new CustomError(500, 'Failed to fetch webinars');
    }
  }

  // removed findByCategory / findBySubCategory (no category validations)

  async update(id: string, dto: UpdateWebinarDto, thumbnail?: Express.Multer.File) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid webinar ID');

      const uploadedFileName = thumbnail ? fileUpload('webniar', thumbnail) : null;
      console.log('uploadedFileName:', uploadedFileName);

      const doc: any = {
        ...dto,
      };

      if (uploadedFileName) {
        doc.thumbnail = `${process.env.SERVER_BASE_URL}uploads/webinar/${uploadedFileName}`;
      }

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
      console.error('Webinar remove error:', e);
      return new CustomError(500, 'Failed to delete webinar');
    }
  }

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

  async getLiveDetails(webinarId: string) {
    try {
      if (!Types.ObjectId.isValid(webinarId)) return new CustomError(400, 'Invalid webinar ID');
      const w = await this.webinarModel.findById(webinarId).select('streamUrl status');
      if (!w) return new CustomError(404, 'Webinar not found');
      if (w.status !== 'Live') return new CustomError(400, 'Webinar not live currently');
      return new CustomResponse(200, 'Live details', { streamUrl: w.streamUrl });
    } catch (e) {
      console.error('Get live details error:', e);
      return new CustomError(500, 'Failed to get live details');
    }
  }

  // add inside WebinarsService class

  /**
   * Generic filter for webinars.
   * Supported query params:
   * - title (partial, case-insensitive)
   * - presenter (partial, case-insensitive)
   * - status (upcoming|live|recorded)
   * - minPrice, maxPrice (numbers)
   * - startDateFrom, startDateTo (ISO date strings)
   * - page, limit (pagination)
   */
  async filterWebinars(query: any) {
    try {
      const filter: any = {};

      // text searches (partial, case-insensitive)
      if (query.title) {
        filter.title = { $regex: String(query.title), $options: 'i' };
      }
      if (query.presenter) {
        filter.presenter = { $regex: String(query.presenter), $options: 'i' };
      }

      // exact value
      if (query.status) {
        // validate allowed statuses optionally
        const allowed = ['Upcoming', 'Live', 'Recorded'];
        if (allowed.includes(String(query.status))) {
          filter.status = String(query.status);
        }
      }

      // price range
      if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice && !Number.isNaN(Number(query.minPrice))) {
          filter.price.$gte = Number(query.minPrice);
        }
        if (query.maxPrice && !Number.isNaN(Number(query.maxPrice))) {
          filter.price.$lte = Number(query.maxPrice);
        }
        // if price ended empty, delete
        if (Object.keys(filter.price).length === 0) delete filter.price;
      }

      // startDate range
      if (query.startDateFrom || query.startDateTo) {
        filter.startDate = {};
        if (query.startDateFrom && !Number.isNaN(Date.parse(query.startDateFrom))) {
          filter.startDate.$gte = new Date(query.startDateFrom);
        }
        if (query.startDateTo && !Number.isNaN(Date.parse(query.startDateTo))) {
          filter.startDate.$lte = new Date(query.startDateTo);
        }
        if (Object.keys(filter.startDate).length === 0) delete filter.startDate;
      }

      // pagination
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
      const skip = (page - 1) * limit;

      // optional sort
      // default: newest first
      const sort: any = { createdAt: -1 };
      if (query.sortBy) {
        // example: sortBy=price:asc  or sortBy=startDate:desc
        const [field, dir] = String(query.sortBy).split(':');
        if (field) sort[field] = dir === 'asc' ? 1 : -1;
      }

      const [items, total] = await Promise.all([
        this.webinarModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        this.webinarModel.countDocuments(filter),
      ]);

      const result = {
        items,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };

      return new CustomResponse(200, 'Filtered webinars fetched successfully', result);
    } catch (e) {
      console.error('Webinar filter error:', e);
      return new CustomError(500, 'Failed to filter webinars');
    }
  }

}
