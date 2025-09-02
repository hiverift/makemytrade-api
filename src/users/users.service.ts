import { Injectable,ConflictException,InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model, isValidObjectId } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // helper
  private async hash(data: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  async create(dto: CreateUserDto) {
    try {
  
      const passwordHash = await this.hash(dto.password);
      const user = new this.userModel({
        email: dto.email,
        name: dto.name,
        passwordHash,
        mobile:dto.mobile,
        role: dto.role ?? 'user',
      });
      await user.save();
      const plain = user.toObject();
      delete (plain as any).passwordHash;
      delete (plain as any).refreshTokenHash;
      return plain;
    } catch (e) {
      if (e instanceof ConflictException) throw e;
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string, includeSecrets = false) {
    try {
      const q = this.userModel.findOne({ email });
      if (includeSecrets) q.select('+passwordHash +refreshTokenHash');
      const user = await q;
      if (!user) return null;
      return user;
    } catch (e) {
      return new CustomError(500, 'Failed to fetch user');
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) return new CustomError(404, 'User not found');

      const plain = user.toObject();
      delete (plain as any).passwordHash;
      delete (plain as any).refreshTokenHash;

      return new CustomResponse(200, 'User fetched successfully', plain);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch user');
    }
  }

  async findAll() {
    try {
      const users = await this.userModel.find().lean();
      const cleaned = users.map(u => {
        delete (u as any).passwordHash;
        delete (u as any).refreshTokenHash;
        return u;
      });
      return new CustomResponse(200, 'Users fetched successfully', cleaned);
    } catch (e) {
      return new CustomError(500, 'Failed to fetch users');
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const updates: any = {};
      if (dto.name) updates.name = dto.name;
      if (dto.role) updates.role = dto.role;
      if (dto.password) updates.passwordHash = await this.hash(dto.password);

      const user = await this.userModel.findByIdAndUpdate(id, updates, { new: true });
      if (!user) return new CustomError(404, 'User not found');

      const plain = user.toObject();
      delete (plain as any).passwordHash;
      delete (plain as any).refreshTokenHash;

      return new CustomResponse(200, 'User updated successfully', plain);
    } catch (e) {
      return new CustomError(500, 'Failed to update user');
    }
  }

  async remove(id: string) {
    try {
      const res = await this.userModel.findByIdAndDelete(id);
      if (!res) return new CustomError(404, 'User not found');

      return new CustomResponse(200, 'User deleted successfully', { deleted: true });
    } catch (e) {
      return new CustomError(500, 'Failed to delete user');
    }
  }

  async setRefreshToken(userId: string, refreshToken: string | null) {
    try {
      const refreshTokenHash = refreshToken ? await this.hash(refreshToken) : null;
      await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash });
      return new CustomResponse(200, 'Refresh token updated successfully');
    } catch (e) {
      return new CustomError(500, 'Failed to update refresh token');
    }
  }

  async comparePassword(email: string, password: string) {
    try {
      const user = await this.findByEmail(email, true);
      if (!user) return null;

      const ok = await bcrypt.compare(password, (user as any).passwordHash);
      return ok ? user : null;
    } catch (e) {
      return new CustomError(500, 'Failed to validate password');
    }
  }

  async validateRefreshToken(userId: string, token: string) {
    try {
      if (!isValidObjectId(userId)) {
        return new CustomError(400, 'Invalid user ID');
      }

      const user = await this.userModel.findById({ _id: userId }).select('+refreshTokenHash');
      if (!user || !user.refreshTokenHash) return false;

      const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
      return isMatch;
    } catch (e) {
      return new CustomError(500, 'Failed to validate refresh token');
    }
  }
  async findByEmailOrMobile(identifier: string, includeSecrets = false) {
  const q = this.userModel.findOne({
    $or: [{ email: identifier }, { mobile: identifier }],
  });
  if (includeSecrets) q.select('+passwordHash +refreshTokenHash');
  return q;
}
async findByMobile(mobile: string, includeSecrets = false) {
  const q = this.userModel.findOne({ mobile });
  if (includeSecrets) q.select('+passwordHash +refreshTokenHash');
  return q;
}
}
