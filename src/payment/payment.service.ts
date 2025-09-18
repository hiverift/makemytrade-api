import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Slot } from 'src/bookings/entities/slot.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razor: Razorpay;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Slot.name) private slotModel: Model<Slot>,
  ) {
    this.razor = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  // Create Razorpay order for a booking
  async createOrder(bookingId: string) {
    try {
      if (!isValidObjectId(bookingId)) return new CustomError(400, 'Invalid booking id');

      const booking = await this.bookingModel.findById(bookingId).lean();
      if (!booking) return new CustomError(404, 'Booking not found');

      if (booking.status === 'paid') return new CustomError(400, 'Booking already paid');

      // amount stored in booking.amount (INR). convert to paise
      const amountPaise = Math.round((booking.amount ?? 0) * 100);
      if (!amountPaise || amountPaise <= 0) return new CustomError(400, 'Invalid booking amount');

      const order = await this.razor.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: String(booking._id),
        notes: { bookingId: String(booking._id) },
      });

      // save payment record
      await this.paymentModel.create({
        bookingId: booking._id,
        provider: 'razorpay',
        orderId: order.id,
        amount: amountPaise,
        status: 'created',
      });

      return new CustomResponse(200, 'Order created', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e: any) {
      this.logger.error('createOrder error', e);
      return new CustomError(500, e?.message || 'Create order failed');
    }
  }

  // Verify signature and finalize booking
  async verifyAndSave(payload: {
    bookingId: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    try {
      const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = payload;
      if (!isValidObjectId(bookingId)) return new CustomError(400, 'Invalid booking id');

      const booking = await this.bookingModel.findById(bookingId);
      if (!booking) return new CustomError(404, 'Booking not found');

      // idempotency: if already paid, return success
      if (booking.status === 'paid') {
        return new CustomResponse(200, 'Booking already paid', { bookingId: booking._id, status: booking.status });
      }

      // compute expected signature
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expected !== razorpay_signature) {
        // mark payment record failed and booking failed + rollback seats if slot
        await this.paymentModel.findOneAndUpdate({ orderId: razorpay_order_id }, {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'failed',
        });

        booking.status = 'failed';
        await booking.save();

        if (booking.slotId) {
          // rollback: increment seatsLeft
          try {
            await this.slotModel.findByIdAndUpdate(booking.slotId, { $inc: { seatsLeft: 1 } });
          } catch (err) { this.logger.warn('rollback seats failed', err); }
        }

        return new CustomError(400, 'Payment verification failed');
      }

      // signature ok -> mark booking paid and update payment record
      booking.status = 'paid';
      booking.paymentRef = razorpay_payment_id;
      await booking.save();

      await this.paymentModel.findOneAndUpdate({ orderId: razorpay_order_id }, {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'captured',
      }, { new: true });

      return new CustomResponse(200, 'Payment verified and booking completed', {
        bookingId: booking._id,
        paymentId: razorpay_payment_id,
        status: booking.status,
      });
    } catch (e: any) {
      this.logger.error('verifyAndSave error', e);
      return new CustomError(500, e?.message || 'Payment verify failed');
    }
  }
}
