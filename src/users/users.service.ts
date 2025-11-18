import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';



interface OrderDoc {
  _id: any;
  userId: any;
  courseId?: any;
  webinarId?: any;
  appointmentId?: any;
  status?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  payment?: any;
  createdAt?: Date;
  updatedAt?: Date;
  // add other fields you rely on
}


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>


  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });

  }

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

   async updateUser(id: string, dto: UpdateUserDto) {
    try {
      const updates: any = {};
      if (dto.name) updates.name = dto.name;
      if (dto.mobile) updates.mobile = dto.mobile;
      if (dto.email) updates.email = dto.email;
      if (dto.address) updates.address = dto.address;
      if (dto.city) updates.city = dto.city;
      if (dto.pincode) updates.pincode = dto.pincode;
      const user = await this.userModel.findByIdAndUpdate(id, updates, { new: true });
      if (!user) return new CustomError(404, 'User not found');

      const plain = user.toObject();
      
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


  private idToString(v: unknown): string | null {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof (v as any)?.toString === 'function') {
      try {
        return (v as any).toString();
      } catch {
        // fall through
      }
    }
    try {
      return String(v);
    } catch {
      return null;
    }
  }

  private toObjectIdIfValid(id: unknown) {
    try {
      if (typeof id === 'string' && Types.ObjectId.isValid(id)) return new Types.ObjectId(id);
      if ((id as any)?._bsontype === 'ObjectID') return id;
      if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id as any);
      return id;
    } catch {
      return id;
    }
  }

  private async sendResetEmail(to: string, name: string, resetLink: string) {


    const mailOptions = {
      from: process.env.SMTP_FROM || `"No Reply" <no-reply@example.com>`,
      to,
      subject: 'Reset your password',
      html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetLink}">Reset password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    };
    console.log('hidien', mailOptions)
    await this.transporter.sendMail(mailOptions);

  }



  // --- Replace existing getAssets with this full-version (returns ALL orders per item) ---

  async getAssets(userId: string, limit = 50, skip = 0): Promise<CustomResponse> {
    try {
      if (!userId) throw new CustomError(400, 'userId required');

      // Accept both ObjectId and string-stored userId in orders collection
      const userIdMatches = Types.ObjectId.isValid(userId)
        ? [{ userId: new Types.ObjectId(userId) }, { userId: userId }]
        : [{ userId }];

      this.logger.debug(`getAssets (all-orders): userId=${userId}`);

      // Fetch all orders for this user (use limit/skip if you want paging)
      const orders = (await this.orderModel
        .find({ $or: userIdMatches })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()) as OrderDoc[];

      this.logger.debug(`Orders fetched count=${orders?.length ?? 0}`);

      // Group orders per item: maps of itemIdString -> OrderDoc[]
      const courseOrdersMap = new Map<string, OrderDoc[]>();
      const webinarOrdersMap = new Map<string, OrderDoc[]>();
      const appointmentOrdersMap = new Map<string, OrderDoc[]>();

      for (const o of orders || []) {
        // course
        const courseKey = this.idToString(o.courseId);
        if (courseKey) {
          const arr = courseOrdersMap.get(courseKey) ?? [];
          arr.push(o);
          courseOrdersMap.set(courseKey, arr);
        }
        // webinar
        const webinarKey = this.idToString(o.webinarId);
        if (webinarKey) {
          const arr = webinarOrdersMap.get(webinarKey) ?? [];
          arr.push(o);
          webinarOrdersMap.set(webinarKey, arr);
        }
        // appointment
        const appointmentKey = this.idToString(o.appointmentId);
        if (appointmentKey) {
          const arr = appointmentOrdersMap.get(appointmentKey) ?? [];
          arr.push(o);
          appointmentOrdersMap.set(appointmentKey, arr);
        }
      }

      this.logger.debug(
        `Grouped sizes -> courses:${courseOrdersMap.size}, webinars:${webinarOrdersMap.size}, appointments:${appointmentOrdersMap.size}`
      );

      // Prepare id arrays to fetch details
      const courseIds = Array.from(courseOrdersMap.keys()).map((id) => this.toObjectIdIfValid(id));
      const webinarIds = Array.from(webinarOrdersMap.keys()).map((id) => this.toObjectIdIfValid(id));
      const appointmentIds = Array.from(appointmentOrdersMap.keys()).map((id) => this.toObjectIdIfValid(id));

      this.logger.debug(`Resolved ids lengths -> courses:${courseIds.length}, webinars:${webinarIds.length}, appointments:${appointmentIds.length}`);

      const [courses, webinars, appointments] = await Promise.all([
        courseIds.length ? this.courseModel.find({ _id: { $in: courseIds } }).lean().exec() : Promise.resolve([]),
        webinarIds.length ? this.webinarModel.find({ _id: { $in: webinarIds } }).lean().exec() : Promise.resolve([]),
        appointmentIds.length ? this.bookingModel.find({ _id: { $in: appointmentIds } }).lean().exec() : Promise.resolve([]),
      ]);

      this.logger.debug(`Fetched docs -> courses:${(courses || []).length}, webinars:${(webinars || []).length}, appointments:${(appointments || []).length}`);

      // Build results: include all orders (summarized) per item and mark paid if any order paid
      const coursesResult = (courses || []).map((c: any) => {
        const id = this.idToString(c._id) ?? String(c._id);
        const ordersForItem = courseOrdersMap.get(id) ?? [];
        const ordersSumm = ordersForItem.map((o) => summarizeOrder(o));
        const paid = ordersSumm.some((o) => o?.payment?.status === 'captured');
        return {
          itemType: 'course',
          itemId: id,
          details: c,
          paid,
          orders: ordersSumm,
        };
      });

      const webinarsResult = (webinars || []).map((w: any) => {
        const id = this.idToString(w._id) ?? String(w._id);
        const ordersForItem = webinarOrdersMap.get(id) ?? [];

        const ordersSumm = ordersForItem.map((o) => summarizeOrder(o));
        const paid = ordersSumm.some((o) => o?.payment?.status === 'captured');
        return {
          itemType: 'webinar',
          itemId: id,
          details: w,
          paid,
          orders: ordersSumm,
        };
      });

      const appointmentsResult = (appointments || []).map((a: any) => {
        const id = this.idToString(a._id) ?? String(a._id);
        const ordersForItem = appointmentOrdersMap.get(id) ?? [];
        const ordersSumm = ordersForItem.map((o) => summarizeOrder(o));
        const paid = ordersSumm.some((o) => o?.payment?.status === 'captured');

        return {
          itemType: 'appointment',
          itemId: id,
          details: a,
          paid,
          orders: ordersSumm,
        };
      });

      // Also include orphan orders info (orders that reference items that couldn't be found in respective collections)
      const missingCourseKeys = Array.from(courseOrdersMap.keys()).filter(
        (k) => !courses.some((c: any) => this.idToString(c._id) === k)
      );
      const missingWebinarKeys = Array.from(webinarOrdersMap.keys()).filter(
        (k) => !webinars.some((w: any) => this.idToString(w._id) === k)
      );
      const missingAppointmentKeys = Array.from(appointmentOrdersMap.keys()).filter(
        (k) => !appointments.some((a: any) => this.idToString(a._id) === k)
      );

      if (missingCourseKeys.length || missingWebinarKeys.length || missingAppointmentKeys.length) {
        this.logger.warn('getAssets: some itemIds have orders but no item document found', {
          missingCourseKeys,
          missingWebinarKeys,
          missingAppointmentKeys,
        });
      }

      return new CustomResponse(200, 'User assets fetched (all orders)', {
        courses: coursesResult,
        webinars: webinarsResult,
        appointments: appointmentsResult,
      });
    } catch (err) {
      this.logger.error('getAssets (all-orders) error', err);
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


  // Helper to hash token for storage
  private hashTokenRaw(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // create reset token, save hashed token and expiry, send email with plain token link
  async createPasswordResetLink(email: string): Promise<CustomResponse> {
    try {
      if (!email) throw new CustomError(400, 'Email required');

      const user = await this.userModel.findOne({ email }).select('+email +mobile +name');

      if (!user) {
        // do not reveal user existence — still return success message
        return new CustomResponse(200, 'User Not Exits!');
      }

      // Generate token (plain) and hashed version for DB
      const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars
      const tokenHash = this.hashTokenRaw(rawToken);
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

      // Save hashed token + expiry on user
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetTokenExpires = expires;
      await user.save();

      // Build reset link — FRONTEND_RESET_URL should be like https://app.example.com/reset-password
      const frontendUrl = process.env.FRONTEND_RESET_URL || 'http://localhost:5173/reset-password';
      const resetLink = `${frontendUrl}?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

      // Send email

      const check = await this.sendResetEmail(user.email, user.name || user.email, resetLink);
      console.log('check', check)

      return new CustomResponse(200, 'Password reset email sent successfully.');
    } catch (err) {
      this.logger.error('createPasswordResetLink err', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to create reset link');
    }
  }



  // verify token and set new password
  async resetPassword(token: string, email: string, newPassword: string): Promise<CustomResponse> {
    try {
      if (!token || !newPassword) throw new CustomError(400, 'Token and newPassword are required');

      const tokenHash = this.hashTokenRaw(token);
      const user = await this.userModel
        .findOne({
          passwordResetTokenHash: tokenHash,
          passwordResetTokenExpires: { $gt: new Date() },
        })
        .select('+passwordHash +passwordResetTokenHash +passwordResetTokenExpires');
      // console.log(user,'user')
      if (!user) throw new CustomError(400, 'Invalid or expired token');

      // set new password
      user.passwordHash = await this.hash(newPassword);

      // remove reset token fields
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpires = null;

      await user.save();

      return new CustomResponse(200, 'Password reset successful.');
    } catch (err) {
      this.logger.error('resetPassword err', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to reset password');
    }
  }
}
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



