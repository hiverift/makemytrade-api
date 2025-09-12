import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq } from './entities/faq.entity';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name);
  constructor(@InjectModel(Faq.name) private faqModel: Model<Faq>) {}

  async create(dto: CreateFaqDto) {
    try {
      // set order default to max(order)+1 if not provided
      if (dto.order === undefined || dto.order === null) {
        const last = await this.faqModel.findOne().sort({ order: -1 }).lean();
        dto.order = last ? (last.order || 0) + 1 : 0;
      }
      const doc = new this.faqModel(dto);
      await doc.save();
      return new CustomResponse(201, 'FAQ created', doc.toObject());
    } catch (e: any) {
      this.logger.error('Create FAQ error', e);
      return new CustomError(500, e?.message ?? 'Failed to create FAQ');
    }
  }

  async findAll(activeOnly = false) {
    try {
      const q = activeOnly ? { active: true } : {};
      const items = await this.faqModel.find(q).sort({ order: 1, createdAt: -1 }).lean();
      return new CustomResponse(200, 'FAQs fetched', items);
    } catch (e: any) {
      this.logger.error('Find all FAQs error', e);
      return new CustomError(500, e?.message ?? 'Failed to fetch FAQs');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.faqModel.findById(id).lean();
      if (!item) return new CustomError(404, 'FAQ not found');
      // increment view count (optional) — don't await blocking
      this.faqModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => {});
      return new CustomResponse(200, 'FAQ fetched', item);
    } catch (e: any) {
      this.logger.error('Find FAQ error', e);
      return new CustomError(500, e?.message ?? 'Failed to fetch FAQ');
    }
  }

  async update(id: string, dto: UpdateFaqDto) {
    try {
      const updated = await this.faqModel.findByIdAndUpdate(id, dto as any, { new: true }).lean();
      if (!updated) return new CustomError(404, 'FAQ not found');
      return new CustomResponse(200, 'FAQ updated', updated);
    } catch (e: any) {
      this.logger.error('Update FAQ error', e);
      return new CustomError(500, e?.message ?? 'Failed to update FAQ');
    }
  }

  async remove(id: string) {
    try {
      const res = await this.faqModel.findByIdAndDelete(id).lean();
      if (!res) return new CustomError(404, 'FAQ not found');
      return new CustomResponse(200, 'FAQ deleted', { deleted: true });
    } catch (e: any) {
      this.logger.error('Delete FAQ error', e);
      return new CustomError(500, e?.message ?? 'Failed to delete FAQ');
    }
  }

  // reorder bulk: pass array of { id, order }
  async reorder(items: { id: string; order: number }[]) {
    try {
      const ops = items.map(it => ({
        updateOne: {
          filter: { _id: it.id },
          update: { $set: { order: it.order } },
        },
      }));
      if (ops.length) await this.faqModel.bulkWrite(ops);
      return new CustomResponse(200, 'FAQs reordered', { updated: ops.length });
    } catch (e: any) {
      this.logger.error('Reorder FAQs error', e);
      return new CustomError(500, e?.message ?? 'Failed to reorder FAQs');
    }
  }

  // toggle active status
  async toggleActive(id: string, active: boolean) {
    try {
      const updated = await this.faqModel.findByIdAndUpdate(id, { active }, { new: true }).lean();
      if (!updated) return new CustomError(404, 'FAQ not found');
      return new CustomResponse(200, 'FAQ status updated', updated);
    } catch (e: any) {
      this.logger.error('Toggle FAQ status error', e);
      return new CustomError(500, e?.message ?? 'Failed to update FAQ status');
    }
  }
}
