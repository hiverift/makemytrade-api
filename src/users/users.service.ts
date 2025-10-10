import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { throwException } from 'src/util/errorhandling';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Course } from 'src/courses/schemas/course.schema';
import { Webinar } from 'src/webinar/entities/webinar.entity';
import { OrderDocument, Order } from 'src/order/entities/order.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Logger } from '@nestjs/common';
import { use } from 'passport';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(

    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,


  ) { }

  // helper
  private async hash(data: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

   async create(dto: CreateUserDto) {
    try {
      const userExit = await this.userModel.findOne({ mobile: dto.mobile }).lean();
      if (userExit) throw new CustomError(401, 'User Already Exits');

      const passwordHash = await this.hash(dto.password);
      const user = new this.userModel({
        email: dto.email,
        name: dto.name,
        passwordHash,
        mobile: dto.mobile,
        role: dto.role ?? 'user',
      });

      const user1 = await user.save();
      const plain = user1.toObject();
      // remove secrets before returning (but return the document/plain object)
      delete (plain as any).passwordHash;
      delete (plain as any).refreshTokenHash;

      // Return the plain user object (not wrapped)
      return plain;
    } catch (e) {
      throwException(e);
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
  async findAllUsers() {
    try {
      const users = await this.userModel.countDocuments().lean();
      return users;
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

  async getUserItemsCount(userId: string) {
    try {
      if (!userId) return new CustomError(400, "User ID required");

      const itemTypes = ["appointment", "course", "webinar"];
      const counts: Record<string, number> = {};

      await Promise.all(
        itemTypes.map(async (type) => {
          const cnt = await this.orderModel.countDocuments({ userId, itemType: type, status: "paid" });
          counts[type] = cnt;
        })
      );

      return new CustomResponse(200, "Paid counts fetched successfully", counts);
    } catch (e) {
      console.warn("getUserPaidItemsCount err", e);
      return new CustomError(500, "Failed to fetch paid counts");
    }
  }
  // ✅ Status Update (Online/Offline)
  async updateStatus(phoneNumber: string, statusDto: UpdateStatusDto) {
    try {
      const user = await this.userModel.findOneAndUpdate({ phoneNumber }, statusDto, { new: true });
      if (!user) throw new CustomError(404, 'User not found');

      return new CustomResponse(200, 'Status updated successfully', user);
    } catch (error) {
      throwException(error);
    }
  }

  async findUserById(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      return user;
    } catch (error) {
      throwException(error);
    }
  }

  async getAssets(userId: string, limit = 50, skip = 0): Promise<CustomResponse> {
    try {
      if (!userId) throw new CustomError(400, 'userId required');

      // 1) fetch orders for this user (we only need relevant fields)
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
      const orders = await this.orderModel
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      console.log('Orders fetched:', orders);
      const latestCourseOrderMap = new Map<string, any>();
      const latestWebinarOrderMap = new Map<string, any>();
      const latestAppointmentOrderMap = new Map<string, any>();

      for (const o of orders) {
        if (o.courseId) {
          const k = o.courseId.toString?.() ?? String(o.courseId);
          if (!latestCourseOrderMap.has(k)) latestCourseOrderMap.set(k, o);
        }
        if (o.webinarId) {
          const k = o.webinarId.toString?.() ?? String(o.webinarId);
          if (!latestWebinarOrderMap.has(k)) latestWebinarOrderMap.set(k, o);
        }
        if (o.appointmentId) {
          const k = o.appointmentId.toString?.() ?? String(o.appointmentId);
          if (!latestAppointmentOrderMap.has(k)) latestAppointmentOrderMap.set(k, o);
        }
      }

      // 2) fetch item details in bulk
      const courseIds = Array.from(latestCourseOrderMap.keys()).map((id) => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id);
      const webinarIds = Array.from(latestWebinarOrderMap.keys()).map((id) => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id);
      const appointmentIds = Array.from(latestAppointmentOrderMap.keys()).map((id) => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id);

      const [courses, webinars, appointments] = await Promise.all([
        courseIds.length ? this.courseModel.find({ _id: { $in: courseIds } }).lean().exec() : Promise.resolve([]),
        webinarIds.length ? this.webinarModel.find({ _id: { $in: webinarIds } }).lean().exec() : Promise.resolve([]),
        appointmentIds.length ? this.bookingModel.find({ _id: { $in: appointmentIds } }).lean().exec() : Promise.resolve([]),
      ]);

      const coursesResult = (courses || []).map((c: any) => {
        const id = c._id.toString();
        const ord = latestCourseOrderMap.get(id) || null;
        const paid = !!(ord && ord.status === 'paid');
        return {
          itemType: 'course',
          itemId: id,
          details: c,
          paid,
          latestOrder: ord ? summarizeOrder(ord) : null,
        };
      });

      const webinarsResult = (webinars || []).map((w: any) => {
        const id = w._id.toString();
        const ord = latestWebinarOrderMap.get(id) || null;
        const paid = !!(ord && ord.status === 'paid');
        return {
          itemType: 'webinar',
          itemId: id,
          details: w,
          paid,
          latestOrder: ord ? summarizeOrder(ord) : null,
        };
      });

      const appointmentsResult = (appointments || []).map((a: any) => {
        const id = a._id.toString();
        const ord = latestAppointmentOrderMap.get(id) || null;
        const paid = !!(ord && ord.status === 'paid');
        return {
          itemType: 'appointment',
          itemId: id,
          details: a,
          paid,
          latestOrder: ord ? summarizeOrder(ord) : null,
        };
      });


      return new CustomResponse(200, 'User assets fetched', {
        courses: coursesResult,
        webinars: webinarsResult,
        appointments: appointmentsResult,
      });
    } catch (err) {
      this.logger.error('getAssets error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to fetch user assets');
    }
  }





  async getPurchasedCourses(userId: string, courseId?: string) {
    try {

      if (!userId) throw new CustomError(400, 'userId required');
      const user = await this.userModel.findById(userId);
      if (!user) throw new CustomError(404, 'userId not found');
      const course = await this.courseModel.findById(courseId);
      if (!course) throw new CustomError(404, 'Course not found');
      // Find all paid orders for the user
      const orders = await this.orderModel
        .find({
          userId,
          status: 'paid',
        })
        .lean();

      // Extract course IDs from orders
      const courseIds = orders
        .filter(order => courseId) // Ensure courseId exists
        .map(order => courseId);

      // Fetch course details for all course IDs
      const courses = await this.courseModel
        .find({ _id: { $in: courseIds } })
        .lean();

      return new CustomResponse(200, 'Fetch Paid Courses', {
        courses: courses || [],
      });
    } catch (error) {
      throwException(error);
    }
  }



}

/** Helper: reduce order object to safe summary to return in API */
function summarizeOrder(o: any) {
  return {
    _id: (o._id && String(o._id)) || null,
    orderId: o.orderId || null,
    status: o.status || null,
    amount: o.amount || null,
    currency: o.currency || null,
    payment: o.payment || null,
    createdAt: o.createdAt || null,
    updatedAt: o.updatedAt || null,
  };
}



