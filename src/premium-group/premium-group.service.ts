// src/premium-groups/premium-groups.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PremiumGroup, PremiumGroupDocument } from './entities/premium-group.entity';
import {
  PremiumGroupAccess,
  PremiumGroupAccessDocument,
} from './entities/premium-group-access.schema';
import { CreatePremiumGroupDto } from './dto/create-premium-group.dto';
import { UpdatePremiumGroupDto } from './dto/update-premium-group.dto';
import { BuyAccessDto } from './dto/buy-access.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class PremiumGroupsService {
  constructor(
    @InjectModel(PremiumGroup.name)
    private readonly groupModel: Model<PremiumGroupDocument>,
    @InjectModel(PremiumGroupAccess.name)
    private readonly accessModel: Model<PremiumGroupAccessDocument>,
  ) { }

  // ADMIN: create group
  async createGroup(
    dto: CreatePremiumGroupDto,
    adminId: string,
  ) {
    try {
      const created = new this.groupModel({
        ...dto,
        createdBy: new Types.ObjectId(adminId),
      });
      return await created.save();
    } catch (error) {
      throwException(error);
    }
  }

  // ADMIN: list all groups
  async findAllAdmin() {
    try {
      const groups = await this.groupModel.find().sort({ createdAt: -1 }).exec();
      return new CustomResponse(200, 'All premium groups', groups); // if you want to wrap
    } catch (error) {
      throwException(error);
    }
  }

  async grantAccessForUser(
    userId: string,
    groupId: string,
    durationHours: number,
  ) {
    try {
      if (!durationHours || durationHours <= 0) {
        throw new BadRequestException('durationHours must be > 0');
    
      }

      await this.findOne(groupId);

      const userObjId = new Types.ObjectId(userId);
      const groupObjId = new Types.ObjectId(groupId);

      const now = new Date();
      const existing = await this.accessModel.findOne({
        userId: userObjId,
        groupId: groupObjId,
      });

      let baseTime: Date;
      if (existing && existing.expiresAt > now) {
        // already active hai, extend karna hai
        baseTime = existing.expiresAt;
      } else {
        baseTime = now;
      }

      const expiresAt = new Date(
        baseTime.getTime() + durationHours * 60 * 60 * 1000,
      );

      if (existing) {
        existing.expiresAt = expiresAt;
        existing.durationHours = (existing.durationHours || 0) + durationHours;
        return await existing.save();
      }

      const access = new this.accessModel({
        userId: userObjId,
        groupId: groupObjId,
        expiresAt,
        durationHours,
      });

      // return await access.save();
      return new CustomResponse(200, 'Access granted/extended successfully', await access.save());
    } catch (error) {
      throwException(error);
    }
  }

  async findAllActive() {
    try {
      return await this.groupModel
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throwException(error);
    }
  }

  async findOne(groupId: string) {
    try {
      const group = await this.groupModel.findById(groupId).exec();
      if (!group) {
        throw new NotFoundException('Premium group not found');
      }
      // return group;
      return new CustomResponse(200, 'Premium Group Get', group);
    } catch (error) {
      throwException(error);
    }
  }

  async updateGroup(
    id: string,
    dto: UpdatePremiumGroupDto,
  ) {
    try {
      const updated = await this.groupModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException('Premium group not found');
      }
      // return updated;
      return new CustomResponse(200, 'Premium Group successfully', updated);
    } catch (error) {
      throwException(error);
    }
  }

  async deleteGroup(id: string): Promise<void> {
    try {
      await this.groupModel.findByIdAndDelete(id).exec();
      // return CustomResponse.success('Premium group deleted successfully', null);
    } catch (error) {
      throwException(error);
    }
  }

  // USER: buy access (ghante ke hisaab se)
  async buyAccess(
    userId: string,
    groupId: string,
    dto: BuyAccessDto,
  ) {
    try {
      await this.findOne(groupId); // ensure group exists

      const userObjId = new Types.ObjectId(userId);
      const groupObjId = new Types.ObjectId(groupId);

      // existing access lao
      const now = new Date();
      const existing = await this.accessModel
        .findOne({ userId: userObjId, groupId: groupObjId })
        .exec();

      let baseTime: Date;
      if (existing && existing.expiresAt > now) {
        // extend from existing expiry
        baseTime = existing.expiresAt;
      } else {
        baseTime = now;
      }

      const expiresAt = new Date(
        baseTime.getTime() + dto.durationHours * 60 * 60 * 1000,
      );

      if (existing) {
        existing.expiresAt = expiresAt;
        existing.durationHours =
          (existing.durationHours || 0) + dto.durationHours;
        return await existing.save();
      }

      const access = new this.accessModel({
        userId: userObjId,
        groupId: groupObjId,
        expiresAt,
        durationHours: dto.durationHours,
      });

      return await access.save();
    } catch (error) {
      throwException(error);
    }
  }

  // check access
  async hasActiveAccess(userId: string, groupId: string) {
    try {
      const now = new Date();
      console.log('Checking access for user:', userId, 'group:', groupId, 'at', now);
      const record = await this.accessModel.findOne({
        userId: new Types.ObjectId(userId),
        groupId: new Types.ObjectId(groupId), 
        expiresAt: { $gt: now },
      });
      console.log('Access record found:', record);
      if (!record) return { hasAccess: false };
      return { hasAccess: true, expiresAt: record.expiresAt };
    } catch (error) {
      throwException(error);
      return undefined as never;
    }
  }

}
