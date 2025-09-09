import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { Consultancy } from './entities/consultancy.entity';
import { CreateConsultancyDto } from './dto/create-consultancy.dto';
import { UpdateConsultancyDto } from './dto/update-consultancy.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class ConsultanciesService {
  private readonly logger = new Logger(ConsultanciesService.name);

  constructor(
    @InjectModel(Consultancy.name) private consultancyModel: Model<Consultancy>,
    @InjectModel('Course') private courseModel: Model<any>,
  ) {}

  private buildLogoUrl(filename?: string) {
    if (!filename) return null;
    const base = process.env.SERVER_BASE_URL?.replace(/\/$/, '') ?? '';
    return `${base}/uploads/consultancies/${filename}`;
  }

  private deleteConsultancyFile(filename: string) {
  try {
    const full = `./uploads/consultancies/${filename}`;
    if (existsSync(full)) unlinkSync(full);
  } catch (err) {
    console.warn('Failed to delete file', filename, err);
  }
  }
  // Create
  async create(dto: CreateConsultancyDto, logo?: Express.Multer.File) {
    try {
      const doc: any = {
        name: dto.name,
        email: dto.email,
        headline: dto.headline,
        description: dto.description,
        expertise: dto.expertise ?? [],
        languages: dto.languages ?? [],
        contactOptions: dto.contactOptions ?? [],
        nextAvailable: dto.nextAvailable ? new Date(dto.nextAvailable) : undefined,
        consultationFee: dto.consultationFee ?? 0,
        experienceYears: dto.experienceYears ?? 0,
        courses: (dto.courses || []).map((id: string) => new Types.ObjectId(id)),
      };

      if (logo) doc.logo = this.buildLogoUrl(logo.filename);

      const item = new this.consultancyModel(doc);
      await item.save();
      const plain = item.toObject();
      return new CustomResponse(201, 'Consultancy created successfully', plain);
    } catch (e: any) {
      this.logger.error('Create consultancy error', e);
      return new CustomError(500, e?.message ?? 'Failed to create consultancy');
    }
  }

  // List all (with simple pagination)
  async findAll(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.consultancyModel.find().skip(skip).limit(limit).lean(),
        this.consultancyModel.countDocuments(),
      ]);
      return new CustomResponse(200, 'Consultancies fetched', { items, total, page, limit });
    } catch (e: any) {
      this.logger.error('Find all consultancies error', e);
      return new CustomError(500, e?.message ?? 'Failed to fetch consultancies');
    }
  }

  // Profile (detailed) - populated courses + computed avg rating (if needed)
  async profile(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid consultancy ID');

      const item = await this.consultancyModel
        .findById(id)
        .populate({ path: 'courses', select: 'title price image instructor rating' })
        .lean();

      if (!item) return new CustomError(404, 'Consultancy not found');

      // compute derived fields (example: avg course price)
      const courses = (item.courses || []) as any[];
      const avgCoursePrice =
        courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.price || 0), 0) / courses.length) : 0;

      const profile = {
        ...item,
        computed: {
          avgCoursePrice,
          coursesCount: courses.length,
        },
      };

      return new CustomResponse(200, 'Consultancy profile fetched', profile);
    } catch (e: any) {
      this.logger.error('Consultancy profile error', e);
      return new CustomError(500, e?.message ?? 'Failed to fetch consultancy profile');
    }
  }

  // Filter consultancies with query object
  // query = { q, expertise, language, minFee, maxFee, page, limit }
  async filter(query: any) {
    try {
      const {
        q,
        expertise,
        language,
        minFee,
        maxFee,
        page = 1,
        limit = 20,
      } = query;

      const filter: any = {};

      if (q) {
        const re = new RegExp(q, 'i');
        filter.$or = [{ name: re }, { headline: re }, { description: re }, { expertise: re }];
      }

      if (expertise) {
        // support comma-separated or array
        const list = Array.isArray(expertise) ? expertise : String(expertise).split(',').map(s => s.trim());
        filter.expertise = { $in: list };
      }

      if (language) {
        const list = Array.isArray(language) ? language : String(language).split(',').map(s => s.trim());
        filter.languages = { $in: list };
      }

      if (minFee || maxFee) {
        filter.consultationFee = {};
        if (minFee) filter.consultationFee.$gte = Number(minFee);
        if (maxFee) filter.consultationFee.$lte = Number(maxFee);
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        this.consultancyModel.find(filter).skip(skip).limit(Number(limit)).lean(),
        this.consultancyModel.countDocuments(filter),
      ]);

      return new CustomResponse(200, 'Consultancies filtered', { items, total, page: Number(page), limit: Number(limit) });
    } catch (e: any) {
      this.logger.error('Filter consultancies error', e);
      return new CustomError(500, e?.message ?? 'Failed to filter consultancies');
    }
  }

  // Find by id (basic)
  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid consultancy ID');

      const item = await this.consultancyModel.findById(id).lean();
      if (!item) return new CustomError(404, 'Consultancy not found');
      return new CustomResponse(200, 'Consultancy fetched', item);
    } catch (e: any) {
      this.logger.error('Find consultancy by id error', e);
      return new CustomError(500, e?.message ?? 'Failed to fetch consultancy');
    }
  }

  // Update
  async update(id: string, dto: UpdateConsultancyDto, logo?: Express.Multer.File) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid consultancy ID');

      const update: any = { ...dto };
      if (dto.nextAvailable) update.nextAvailable = new Date(dto.nextAvailable as any);
      if (dto.courses) update.courses = (dto.courses as any).map((s: string) => new Types.ObjectId(s));

      if (logo) {
        const existing = await this.consultancyModel.findById(id).lean();
        if (existing?.logo) {
          const filename = existing.logo.split('/').slice(-1)[0];
          this.deleteConsultancyFile(filename);
        }
        update.logo = this.buildLogoUrl(logo.filename);
      }

      const updated = await this.consultancyModel.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!updated) return new CustomError(404, 'Consultancy not found');
      return new CustomResponse(200, 'Consultancy updated successfully', updated);
    } catch (e: any) {
      this.logger.error('Update consultancy error', e);
      return new CustomError(500, e?.message ?? 'Failed to update consultancy');
    }
  }

  // Remove
  async remove(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) return new CustomError(400, 'Invalid consultancy ID');
      const doc = await this.consultancyModel.findByIdAndDelete(id).lean();
      if (!doc) return new CustomError(404, 'Consultancy not found');
      if (doc.logo) {
        const filename = doc.logo.split('/').slice(-1)[0];
        this.deleteConsultancyFile(filename);
      }
      return new CustomResponse(200, 'Consultancy deleted successfully', { deleted: true });
    } catch (e: any) {
      this.logger.error('Delete consultancy error', e);
      return new CustomError(500, e?.message ?? 'Failed to delete consultancy');
    }
  }
}
