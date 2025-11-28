// src/premium-group/premium-group-messages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PremiumGroupMessage,
  PremiumGroupMessageDocument,
} from '../premium-group-message/enties/premium-group-message.schema';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class PremiumGroupMessagesService {
  constructor(
    @InjectModel(PremiumGroupMessage.name)
    private readonly messageModel: Model<PremiumGroupMessageDocument>,
  ) {}

  async createMessage(params: {
    groupId: string;
    from: 'user' | 'admin';
    userId?: string;
    adminId?: string;
    text?: string;
    attachments?: string[];
  }) {
    try {
      const doc = new this.messageModel({
        groupId: new Types.ObjectId(params.groupId),
        from: params.from,
        userId: params.userId ? new Types.ObjectId(params.userId) : null,
        adminId: params.adminId ? new Types.ObjectId(params.adminId) : null,
        text: params.text || '',
        attachments: params.attachments || [],
      });

      const saved = await doc.save();
      return saved;
    } catch (error) {
      throwException(error);
    }
  }

  async getGroupMessages(
    groupId: string,
    limit = 50,
    before?: string,
  ): Promise<PremiumGroupMessage[]> {
    try {
      const query: any = {
        groupId: new Types.ObjectId(groupId),
        isDeleted: false,
      };

      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      return await this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      throwException(error);
      return [];
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      const updated = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            $push: {
              reactions: {
                userId: new Types.ObjectId(userId),
                emoji,
                createdAt: new Date(),
              },
            },
          },
          { new: true },
        )
        .lean()
        .exec();

      if (!updated) {
        throw new NotFoundException('Message not found');
      }

      return updated;
    } catch (error) {
      throwException(error);
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      const updated = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            $pull: {
              reactions: {
                userId: new Types.ObjectId(userId),
                emoji,
              },
            },
          },
          { new: true },
        )
        .lean()
        .exec();

      if (!updated) {
        throw new NotFoundException('Message not found');
      }

      return updated;
    } catch (error) {
      throwException(error);
    }
  }

  async editMessage(messageId: string, userId: string, newText: string) {
    try {
      const message = await this.messageModel.findById(messageId).exec();
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.userId?.toString() !== userId) {
        throw new NotFoundException('Not allowed to edit this message');
      }

      message.text = newText;
      const saved = await message.save();
      return saved.toObject();
    } catch (error) {
      throwException(error);
    }
  }

  async softDeleteMessage(messageId: string, userId: string) {
    try {
      const message = await this.messageModel.findById(messageId).exec();
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.userId?.toString() !== userId) {
        throw new NotFoundException('Not allowed to delete this message');
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      const saved = await message.save();
      return saved.toObject();
    } catch (error) {
      throwException(error);
    }
  }

  // 🔹 READ RECEIPT: mark single message as read by user
  async markMessageRead(messageId: string, userId: string) {
    try {
      const updated = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            $addToSet: {
              readBy: new Types.ObjectId(userId),
            },
          },
          { new: true },
        )
        .lean()
        .exec();

      if (!updated) {
        throw new NotFoundException('Message not found');
      }

      return updated;
    } catch (error) {
      throwException(error);
    }
  }

  // OPTIONAL: agar tum chaaho to multiple messages ek sath mark read kar sakte ho
  async markManyMessagesRead(messageIds: string[], userId: string) {
    try {
      await this.messageModel.updateMany(
        {
          _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
        },
        {
          $addToSet: {
            readBy: new Types.ObjectId(userId),
          },
        },
      );
      // front-end ke liye individually fetch kar sakte ho agar chaho
    } catch (error) {
      throwException(error);
    }
  }
}
