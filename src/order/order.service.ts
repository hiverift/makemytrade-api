import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);
import { Order, OrderDocument, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/create-razorpay-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

import { UsersService } from 'src/users/users.service';
import { CoursesService } from 'src/courses/courses.service';
import { WebinarsService } from 'src/webinar/webinar.service';
import { BookingsService } from 'src/bookings/bookings.service';

@Injectable()
export class OrdersService {
  private razorpay: Razorpay;
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private configService: ConfigService,
    private usersService: UsersService,
    private coursesService: CoursesService,
    private webinarsService: WebinarsService,
    private appointmentsService: BookingsService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  /* ----------------- helper: safe extractor for service responses ----------------- */
  private extractEntity<T = any>(maybe: any): T | null {
    // if service returns CustomResponse-like { data, ... } or { course } or raw entity
    if (!maybe) return null;
    if (maybe instanceof CustomError) return null;
    if (maybe.data) return maybe.data as T;
    // some services return { course: {...} } etc.
    if (maybe.course) return maybe.course as T;
    if (maybe.webinar) return maybe.webinar as T;
    if (maybe.appointment) return maybe.appointment as T;
    // if it's already the entity (has price/fee)
    if (typeof maybe === 'object') return maybe as T;
    return null;
  }

  /** Create order — validate item exists and compute server-side price (paise) */
  async createOrder(dto: CreateOrderDto): Promise<CustomResponse> {
    try {
    
      // Determine which ID provided
      const { courseId, webinarId, appointmentId, itemType } = dto;

      if (!courseId && !webinarId && !appointmentId) {
        throw new CustomError(400, 'One of courseId | webinarId | appointmentId is required');
      }

      // Resolve actual itemType if not provided
      let resolvedType = itemType;
      if (!resolvedType) {
        if (courseId) resolvedType = 'course';
        else if (webinarId) resolvedType = 'webinar';
        else if (appointmentId) resolvedType = 'appointment';
      }

      // Resolve price
      const pricePaise = await this.resolvePriceByIds({ courseId, webinarId, appointmentId, resolvedType });
      if (pricePaise == null) throw new CustomError(404, 'Requested item not found');
      console.log('check price from courses', pricePaise)
      // Check optional client-provided amount
      const opts: any = {};
    if (dto.amount != null) {
      opts.amount = Math.round(dto.amount * 100); // rupee → paise
    }
   
    //  const finalprice= Math.round(dto.amount * 100);
      if (opts.amount !== pricePaise) {
        throw new CustomError(400, 'Amount mismatch');
      }

      const orderRef = `ORD-${nanoid()}`;
      console.log('userid ',dto.userId)
      const order = new this.orderModel({
        orderId: orderRef,                  // <--- new line
        userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
        courseId: courseId || undefined,
        webinarId: webinarId || undefined,
        appointmentId: appointmentId || undefined,
        itemType: resolvedType,
        amount: pricePaise,
        currency: 'INR',
        status: OrderStatus.CREATED,
        meta: dto.meta || {},
      });

      const saved = await order.save();
      return new CustomResponse(201, 'Order created', { order: saved });
    } catch (err) {
      this.logger.error('createOrder error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to create order');
    }
  }

  /** Create Razorpay order and attach to DB order */
  async createRazorpayOrder(orderId: string, dto: CreateRazorpayOrderDto): Promise<CustomResponse> {
    try {
      console.log('hiii order id ', orderId)
      const order = await this.orderModel.findOne({orderId:orderId}).lean();
      console.log('order',order)
      if (!order) throw new CustomError(404, 'Order not found');

      const amount = order.amount; // use DB amount
      const currency = dto.currency || order.currency || 'INR';
      const receipt = dto.receipt || `receipt_${orderId}`;

      // NOTE: cast rOrder as any to avoid weird TS types from razorpay typings
      const rOrder: any = await (this.razorpay as any).orders.create({
        amount,
        currency,
        receipt,
        notes: {
          orderId,
          courseId: (order.courseId ?? null) as string | number | null,
          webinarId: (order.webinarId ?? null) as string | number | null,
          appointmentId: (order.appointmentId ?? null) as string | number | null,
        },
      });

      order.payment = {
        ...order.payment,
        razorpayOrderId: (rOrder as any).id,
        status: 'created',
        currency: (rOrder as any).currency,
        notes: (rOrder as any).notes,
      };
      order.status = OrderStatus.PENDING_PAYMENT;
    const doc = this.orderModel.hydrate(order);
     await doc.save();

      return new CustomResponse(200, 'Razorpay order created', { rOrder, orderId: order._id });
    } catch (err) {
      this.logger.error('createRazorpayOrder error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to create Razorpay order');
    }
  }

  /** Verify signature helper */
  verifyPaymentSignature(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const key_secret = this.configService.get('RAZORPAY_KEY_SECRET');
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest('hex');
    return generated_signature === payload.razorpay_signature;
  }

  /** Verify & confirm payment (client flow) */
  async verifyAndConfirmPayment(orderId: string, dto: VerifyPaymentDto): Promise<CustomResponse> {
    try {
      const order = await this.orderModel.findById(orderId).exec();
      if (!order) throw new CustomError(404, 'Order not found');

      const ok = this.verifyPaymentSignature({
        razorpay_order_id: dto.razorpay_order_id,
        razorpay_payment_id: dto.razorpay_payment_id,
        razorpay_signature: dto.razorpay_signature,
      });

      if (!ok) {
        order.payment = { ...order.payment, razorpayPaymentId: dto.razorpay_payment_id, razorpaySignature: dto.razorpay_signature, status: 'signature_mismatch' };
        order.status = OrderStatus.FAILED;
        await order.save();
        throw new CustomError(400, 'Invalid payment signature');
      } 

      // Fetch payment from Razorpay to get final status and captured amount
      let paymentEntity: any = null;
      try {
        paymentEntity = await (this.razorpay as any).payments.fetch(dto.razorpay_payment_id);
      } catch (e) {
        this.logger.warn('Failed to fetch payment from Razorpay; proceeding with given data');
      }

      order.payment = {
        ...order.payment,
        razorpayPaymentId: dto.razorpay_payment_id,
        razorpaySignature: dto.razorpay_signature,
        razorpayOrderId: dto.razorpay_order_id,
        status: paymentEntity?.status || 'paid',
        capturedAmount: paymentEntity?.amount || order.amount,
        currency: paymentEntity?.currency || order.currency,
        notes: paymentEntity?.notes || order.payment?.notes,
      };

      order.status = OrderStatus.PAID;
      await order.save();

      // Post-payment actions: enroll/register/confirm
      await this.postPaymentSuccessAction(order);

      return new CustomResponse(200, 'Payment verified and order marked as paid', { order });
    } catch (err) {
      this.logger.error('verifyAndConfirmPayment error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to verify payment');
    }
  }

  /** Webhook signature verification */
  verifyWebhookSignature(body: string, signature: string): boolean {
    console.log( 'scret',this.configService.get('RAZORPAY_WEBHOOK_SECRET'))
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET') || '';
    console.log(webhookSecret)
    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
     console.log('hiii',expected)
    return expected === signature;
  }

  /** Handle webhook events */
  async handleWebhook(payload: any): Promise<void> {
    try {
      if (!payload || !payload.event) return;

      if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
        const paymentEntity = payload.payload.payment.entity;
        const notes = paymentEntity.notes || {};
        const orderIdFromNotes = notes.orderId;
        let localOrder: any = null;

        if (paymentEntity.order_id) {
          localOrder = await this.orderModel.findOne({ 'payment.razorpayOrderId': paymentEntity.order_id }).exec();
        }

        if (!localOrder && orderIdFromNotes) {
          localOrder = await this.orderModel.findById(orderIdFromNotes).exec();
        }

        if (!localOrder) {
          this.logger.warn('Webhook: local order not found for payment', paymentEntity);
          return;
        }

        localOrder.payment = {
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          razorpaySignature: '',
          status: paymentEntity.status,
          capturedAmount: paymentEntity.amount,
          currency: paymentEntity.currency,
          notes: paymentEntity.notes,
        };
        localOrder.status = OrderStatus.PAID;
        await localOrder.save();

        await this.postPaymentSuccessAction(localOrder);
      }
    } catch (err) {
      this.logger.error('handleWebhook error', err);
    }
  }

  /** Resolve price using whichever ID provided (returns paise) */
  private async resolvePriceByIds({ courseId, webinarId, appointmentId, resolvedType }: { courseId?: string; webinarId?: string; appointmentId?: string; resolvedType?: string; }): Promise<number | null> {
    try {
      if (courseId) {
        const raw = await this.coursesService.findById(courseId);
        const course = this.extractEntity(raw);
        if (!course) return null;
        const rupees = (course.result.price ?? 0) as number;
        console.log('Math.round(rupees * 100)', Math.round(rupees * 100))
        return Math.round(rupees * 100) ;
      }

      if (webinarId) {
        const raw = await this.webinarsService.findById(webinarId);
        const webinar = this.extractEntity(raw);
        if (!webinar) return null;
        const rupees = (webinar.result.price ?? 0) as number;
        return Math.round(rupees * 100);
      }
      if (appointmentId) {
        const raw = await this.appointmentsService.findById(appointmentId);
        console.log('raw',raw)
        const appointment = this.extractEntity(raw);
        if (!appointment) return null;
        const rupees = (appointment.result.amount ?? appointment.result.amount ?? 0) as number;
        return Math.round(rupees * 100);
      }
      
      // fallback: use resolvedType with IDs not given (shouldn't occur)
      if (resolvedType === 'course' && courseId) return this.resolvePriceByIds({ courseId });
      if (resolvedType === 'webinar' && webinarId) return this.resolvePriceByIds({ webinarId });
      if (resolvedType === 'appointment' && appointmentId) return this.resolvePriceByIds({ appointmentId });

      return null;
    } catch (err) {
      this.logger.error('resolvePriceByIds error', err);
      return null;
    }
  }

  /** Actions after a payment is successful */
  private async postPaymentSuccessAction(order: OrderDocument) {
    try {
      const userId = order.user ? (order.user as any).toString() : null;

      if (order.courseId) {
        if (userId && (this.coursesService as any).enrollUser) {
          await (this.coursesService as any).enrollUser(order.courseId, userId).catch((e) => this.logger.warn('enrollUser failed', e));
        }
      }

      if (order.webinarId) {
        if (userId && (this.webinarsService as any).registerUserToWebinar) {
          await (this.webinarsService as any).registerUserToWebinar(order.webinarId, userId).catch((e) => this.logger.warn('registerUserToWebinar failed', e));
        }
      }

      if (order.appointmentId) {
        if ((this.appointmentsService as any).confirmAppointment) {
          await (this.appointmentsService as any).confirmAppointment(order.appointmentId, userId).catch((e) => this.logger.warn('confirmAppointment failed', e));
        }
      }
    } catch (err) {
      this.logger.error('postPaymentSuccessAction error', err);
    }
  }

  /** read helpers */
 async findById(orderId: string): Promise<CustomResponse> {
  try {
    const order = await this.findOrderByIdOrRef(orderId);
    if (!order) throw new CustomError(404, 'Order not found');
    return new CustomResponse(200, 'Order fetched', { order });
  } catch (err) {
    if (err instanceof CustomError) throw err;
    throw new CustomError(500, 'Failed to fetch order');
  }
}
  async list(limit = 20, skip = 0): Promise<CustomResponse> {
    try {
      const orders = await this.orderModel.find().sort({ createdAt: -1 }).limit(limit).skip(skip).exec();
      return new CustomResponse(200, 'Orders list', { orders });
    } catch (err) {
      throw new CustomError(500, 'Failed to list orders');
    }
  }

  /** Get orders by user (with pagination) */
  async findByUser(userId: string, limit = 20, skip = 0): Promise<CustomResponse> {
    try {
      const uId = new Types.ObjectId(userId);
      const orders = await this.orderModel.find({ user: uId }).sort({ createdAt: -1 }).limit(limit).skip(skip).exec();
      return new CustomResponse(200, 'Orders fetched for user', { orders });
    } catch (err) {
      this.logger.error('findByUser error', err);
      throw new CustomError(500, 'Failed to fetch orders for user');
    }
  }

  /** Get orders by courseId */
  async findByCourse(courseId: string, limit = 20, skip = 0): Promise<CustomResponse> {
    try {
      const orders = await this.orderModel.find({ courseId }).sort({ createdAt: -1 }).limit(limit).skip(skip).exec();
      return new CustomResponse(200, 'Orders fetched for course', { orders });
    } catch (err) {
      this.logger.error('findByCourse error', err);
      throw new CustomError(500, 'Failed to fetch orders for course');
    }
  }

  /** Get orders by webinarId */
  async findByWebinar(webinarId: string, limit = 20, skip = 0): Promise<CustomResponse> {
    try {
      console.log('web',webinarId)
      const orders = await this.orderModel.find({ webinarId }).sort({ createdAt: -1 }).limit(limit).skip(skip).exec();
      return new CustomResponse(200, 'Orders fetched for webinar', { orders });
    } catch (err) {
      this.logger.error('findByWebinar error', err);
      throw new CustomError(500, 'Failed to fetch orders for webinar');
    }
  }

  /** Get orders by appointmentId */
  async findByAppointment(appointmentId: string, limit = 20, skip = 0): Promise<CustomResponse> {
    try {
      const orders = await this.orderModel.find({ appointmentId }).sort({ createdAt: -1 }).limit(limit).skip(skip).exec();
      console.log(orders,'orders')
      if(!orders)
      {
        throw new CustomError(401,'Not found Order For this Id')
      }
      return new CustomResponse(200, 'Orders fetched for appointment', { orders });
    } catch (err) {
      this.logger.error('findByAppointment error', err);
      throw new CustomError(500, 'Failed to fetch orders for appointment');
    }
  }

  /* ---------- Payment history ---------- */

  async getPaymentHistoryForOrder(orderId: string): Promise<CustomResponse> {
    try {
      const order = await this.orderModel.findById(orderId).exec();
      if (!order) throw new CustomError(404, 'Order not found');

      const payment = order.payment || null;
      let rPayment: any = null;
      try {
        if (payment?.razorpayPaymentId) {
          rPayment = await (this.razorpay as any).payments.fetch(payment.razorpayPaymentId);
        }
      } catch (e) {
        this.logger.warn('Failed to fetch payment from Razorpay', e);
      }

      return new CustomResponse(200, 'Payment history for order', { payment, rPayment });
    } catch (err) {
      this.logger.error('getPaymentHistoryForOrder error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to fetch payment history for order');
    }
  }

  async getPaymentHistoryForUser(userId: string, limit = 50, skip = 0): Promise<CustomResponse> {
    try {
      const uId = new Types.ObjectId(userId);
      const orders = await this.orderModel.find({ user: uId }).sort({ createdAt: -1 }).limit(limit).skip(skip).exec();

      const payments = orders.map((o: any) => ({
        orderId: o._id,
        itemType: o.itemType,
        itemRef: o.courseId || o.webinarId || o.appointmentId,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        payment: o.payment || null,
        createdAt: (o as any).createdAt,
      }));

      return new CustomResponse(200, 'Payment history for user', { payments });
    } catch (err) {
      this.logger.error('getPaymentHistoryForUser error', err);
      throw new CustomError(500, 'Failed to fetch payment history for user');
    }
  }

  /* ---------- Update / Delete ---------- */

  async updateOrder(orderId: string, dto: UpdateOrderDto): Promise<CustomResponse> {
    try {
      const order = await this.orderModel.findById(orderId).exec();
      if (!order) throw new CustomError(404, 'Order not found');

      if (dto.meta) order.meta = { ...(order.meta || {}), ...dto.meta };
      if (dto.status) order.status = dto.status as any;
      if (typeof dto.amount === 'number') order.amount = dto.amount;

      await order.save();
      return new CustomResponse(200, 'Order updated', { order });
    } catch (err) {
      this.logger.error('updateOrder error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to update order');
    }
  }

  async deleteOrder(orderId: string): Promise<CustomResponse> {
    try {
      const order = await this.orderModel.findById(orderId).exec();
      if (!order) throw new CustomError(404, 'Order not found');

      await this.orderModel.findByIdAndDelete(orderId).exec();
      return new CustomResponse(200, 'Order deleted', { orderId });
    } catch (err) {
      this.logger.error('deleteOrder error', err);
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to delete order');
    }
  }

  /* ---------- Refund ---------- */

  async refundPayment(orderId: string, dto: RefundPaymentDto): Promise<CustomResponse> {
    try {
      const order = await this.orderModel.findById(orderId).exec();
      if (!order) throw new CustomError(404, 'Order not found');
      const paymentId = order.payment?.razorpayPaymentId;
      if (!paymentId) throw new CustomError(400, 'No payment associated with this order');

      const opts: any = {};
      if (dto.amount) opts.amount = dto.amount;

      const refundResp = await (this.razorpay as any).payments.refund(paymentId, opts);

      // Save refund info in meta.refunds array (safer than adding unknown prop to payment type)
      order.meta = order.meta || {};
      order.meta.refunds = order.meta.refunds || [];
      (order.meta.refunds as any[]).push(refundResp);

      order.status = OrderStatus.REFUNDED;
      await order.save();

      return new CustomResponse(200, 'Refund initiated', { refundResp, order });
    } catch (err) {
      this.logger.error('refundPayment error', err);
      if (err?.error?.description) {
        throw new CustomError(400, `Razorpay error: ${err.error.description}`);
      }
      if (err instanceof CustomError) throw err;
      throw new CustomError(500, 'Failed to refund payment');
    }
  }
  private async findOrderByIdOrRef(idOrRef: string) {
  if (!idOrRef) return null;
  // valid ObjectId -> treat as _id
  if (Types.ObjectId.isValid(idOrRef)) {
    // sometimes a 12-char string also passes; still okay
    const byId = await this.orderModel.findById(idOrRef).exec();
    if (byId) return byId;
    // fallback to search by orderId too (in case an ORD-... also looks like valid ObjectId)
  }
  // otherwise search by orderId field
  return await this.orderModel.findOne({ orderId: idOrRef }).exec();
}
}
