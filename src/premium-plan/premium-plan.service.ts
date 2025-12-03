import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PremiumPlan,PremiumPlanDocument } from './entities/premium-plan.entity';
import { CreatePremiumPlanDto } from './dto/create-premium-plan.dto';
import { UpdatePremiumPlanDto } from './dto/update-premium-plan.dto';

@Injectable()
export class PremiumPlanService {
  constructor(
    @InjectModel(PremiumPlan.name) private planModel: Model<PremiumPlanDocument>,
  ) {}

  async create(groupId: string, dto: CreatePremiumPlanDto) {
    const doc = await this.planModel.create({
      groupId: new Types.ObjectId(groupId),
      name: dto.name,
      description: dto.description ?? '',
      amount: dto.amount,
      currency: dto.currency ?? 'INR',
      durationHours: dto.durationHours,
      isActive: true,
    });
    return doc.toObject();
  }

  async update(planId: string, dto: UpdatePremiumPlanDto) {
    const updated = await this.planModel.findByIdAndUpdate(planId, { $set: dto }, { new: true });
    if (!updated) throw new NotFoundException('Plan not found');
    return updated.toObject();
  }

  async delete(planId: string) {
    const doc = await this.planModel.findByIdAndDelete(planId);
    if (!doc) throw new NotFoundException('Plan not found');
    return { success: true };
  }

  async findByGroup(groupId: string) {
    return this.planModel.find({ groupId: new Types.ObjectId(groupId), isActive: true }).sort({ amount: 1 }).lean();
  }

  async findOne(planId: string) {
    return this.planModel.findById(planId).lean();
  }
}
