import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { Slot } from './entities/slot.schema';
import { Booking } from './entities/booking.entity';
import { ServiceItem } from 'src/services/entities/service.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { BulkSlotsDto } from './dto/bulk-slots.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class BookingsService {
  private logger = new Logger(BookingsService.name);
  constructor(
    @InjectModel(Slot.name) private slotModel: Model<Slot>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(ServiceItem.name) private serviceModel: Model<ServiceItem>,
  ) {}

  // ---------- Slots (Admin) ----------
  async createSlot(dto: CreateSlotDto) {
    try{
      const service = await this.serviceModel.findById(dto.serviceId).lean();
      if(!service) return new CustomError(404,'Service not found');

      const seatsLeft = dto.capacity ?? 1;
      const slot = await this.slotModel.create({
        serviceId: new Types.ObjectId(dto.serviceId),
        start: new Date(dto.start.replace(' ', 'T')),
        end: new Date(dto.end.replace(' ', 'T')),
        capacity: seatsLeft,
        seatsLeft,
        active: true,
      });
      return new CustomResponse(201,'Slot created', slot.toObject());
    }catch(e:any){ this.logger.error(e); return new CustomError(500,e?.message||'Create slot failed');}
  }

  // bulk create daily slots between date range for given times (admin)
 // replace the existing bulkCreateSlots method with this
async bulkCreateSlots(dto: any) {
  try {
    // debug raw body & keys
    this.logger.debug('bulkCreateSlots raw DTO -> ' + JSON.stringify(dto));
    this.logger.debug('bulkCreateSlots dto keys -> ' + Object.keys(dto).join(','));

    if (!dto || !dto.serviceId) {
      return new CustomError(400, 'serviceId is required');
    }

    const service = await this.serviceModel.findById(dto.serviceId).lean();
    if (!service) return new CustomError(404, 'Service not found');

    // Try many places to find times (robust)
    let rawTimes = (dto as any).times ?? (dto as any)['times[]'] ?? (dto as any).items?.times ?? undefined;

    // Sometimes when validation/transformation occurs, body may be nested: check req-like shape
    if (!rawTimes && (dto as any).body) {
      rawTimes = (dto as any).body.times ?? (dto as any).body['times[]'] ?? undefined;
    }

    this.logger.debug('bulkCreateSlots rawTimes initial -> ' + JSON.stringify(rawTimes) + ' (type: ' + typeof rawTimes + ')');

    // normalize into string[]
    let times: string[] = [];
    if (Array.isArray(rawTimes)) {
      times = rawTimes.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof rawTimes === 'string') {
      const raw = rawTimes.trim();
      // attempt JSON parse
      try {
        const parsed = JSON.parse(raw);
        times = Array.isArray(parsed) ? parsed.map(String).map(s => s.trim()).filter(Boolean) : raw.replace(/^\[|\]$/g, '').split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
      } catch {
        times = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (rawTimes == null) {
      // As a last resort, check keys like times[0], times[1] (form-data sent by some clients)
      const possibleIndexed: string[] = [];
      Object.keys(dto).forEach(k => {
        const m = k.match(/^times\[(\d+)\]$/);
        if (m) possibleIndexed.push(dto[k]);
      });
      if (possibleIndexed.length) {
        times = possibleIndexed.map(String).map(s => s.trim()).filter(Boolean);
      } else {
        // nothing
        times = [];
      }
    } else {
      // other types => cast
      times = String(rawTimes).split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    this.logger.debug('bulkCreateSlots normalized times -> ' + JSON.stringify(times));

    if (!times.length) return new CustomError(400, 'No times provided (times must be an array or comma-separated string).');

    // parse from/to
    const fromStr = String(dto.from ?? '').substring(0, 10);
    const toStr = String(dto.to ?? '').substring(0, 10);
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return new CustomError(400, 'Invalid from/to date (use YYYY-MM-DD or ISO format).');
    }
    if (fromDate.getTime() > toDate.getTime()) {
      return new CustomError(400, '"from" must be before or same as "to".');
    }

    // build docs
    const docs: any[] = [];
    const serviceDuration = Number(service.durationMinutes) || 60;
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().substring(0, 10);
      for (const t of times) {
        const parts = String(t).split(':').map(Number);
        const hh = Number.isFinite(parts[0]) ? parts[0] : 0;
        const mm = Number.isFinite(parts[1]) ? parts[1] : 0;
        const startIso = `${day}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00.000Z`;
        const start = new Date(startIso);
        const end = new Date(start.getTime() + serviceDuration * 60000);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
        docs.push({
          serviceId: new Types.ObjectId(dto.serviceId),
          start,
          end,
          capacity: dto.capacity ?? 1,
          seatsLeft: dto.capacity ?? 1,
          active: true,
        });
      }
    }

    if (!docs.length) return new CustomError(400, 'No slots generated. Check date range and times.');

    await this.slotModel.insertMany(docs);
    return new CustomResponse(201, 'Slots created', { count: docs.length });
  } catch (e: any) {
    this.logger.error('bulkCreateSlots error', e);
    return new CustomError(500, e?.message ?? 'Bulk slot create failed');
  }
}



  // calendar availability (public)
  // add at top if not present:
// import { isValidObjectId, Types } from 'mongoose';

async availability(serviceId: string, monthOrDay?: string, includeFull = false) {
  try {
    // basic validation
    if (!serviceId || !isValidObjectId(serviceId)) {
      return new CustomError(400, 'Invalid service id');
    }

    // build base query
    const q: any = { serviceId: new Types.ObjectId(serviceId), active: true };

    // seatsLeft filter (skip if includeFull true)
    if (!includeFull) q.seatsLeft = { $gt: 0 };

    // handle month (YYYY-MM) or day (YYYY-MM-DD)
    if (monthOrDay) {
      const raw = String(monthOrDay).trim();
      const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
      const dayMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (monthMatch) {
        const year = Number(monthMatch[1]);
        const month = Number(monthMatch[2]) - 1;
        const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
        q.start = { $gte: start, $lt: end };
      } else if (dayMatch) {
        const day = raw.substring(0, 10);
        const start = new Date(`${day}T00:00:00.000Z`);
        const end = new Date(`${day}T23:59:59.999Z`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return new CustomError(400, 'Invalid date format (use YYYY-MM or YYYY-MM-DD)');
        }
        q.start = { $gte: start, $lte: end };
      } else {
        return new CustomError(400, 'Invalid date format (use YYYY-MM or YYYY-MM-DD)');
      }
    } else {
      // default: upcoming month from now (optional) — here we will fetch upcoming slots
      q.start = { $gte: new Date() };
    }

    // debug: print the query (server console)
    this.logger.debug('availability query -> ' + JSON.stringify(q));

    const slots = await this.slotModel.find(q).sort({ start: 1 }).populate({
      path: 'serviceId',
      select: 'name price durationMinutes',
    }).lean();

    return new CustomResponse(200, 'Availability fetched', slots);
  } catch (e: any) {
    this.logger.error('Availability error', e);
    return new CustomError(500, e?.message || 'Fetch availability failed');
  }
}


  // ---------- Booking (User) ----------
  // Step 1: create booking (hold seat) + "mock payment intent"
  async createBooking(dto: CreateBookingDto){
    try{
      const service = await this.serviceModel.findById(dto.serviceId).lean();
      if(!service) return new CustomError(404,'Service not found');

      const slot = await this.slotModel.findById(dto.slotId);
      if(!slot || !slot.active) return new CustomError(404,'Slot not found');
      if(slot.seatsLeft <= 0) return new CustomError(409,'Slot full');

      // atomic decrement — prevent race condition
      const updated = await this.slotModel.findOneAndUpdate(
        { _id: slot._id, seatsLeft: { $gt: 0 } },
        { $inc: { seatsLeft: -1 } },
        { new: true }
      );
      if(!updated) return new CustomError(409,'Slot just got full');

      const booking = await this.bookingModel.create({
        serviceId: service._id,
        slotId: slot._id,
        userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
        amount: service.price,
        status: 'pending',
        paymentMethod: dto.paymentMethod ?? 'mock',
      });

      // mock payment order id
      const paymentRef = `ORD_${String(booking._id).slice(-6)}_${Date.now()}`;
      await this.bookingModel.findByIdAndUpdate(booking._id, { paymentRef });

      return new CustomResponse(201,'Booking created (pending payment)', {
        bookingId: booking._id,
        amount: service.price,
        paymentRef,
      });
    }catch(e:any){ this.logger.error(e); return new CustomError(500,e?.message||'Create booking failed');}
  }

  // Step 2: confirm payment (webhook/callback or client confirm)
  async confirmPayment(dto: ConfirmPaymentDto){
    try{
      const booking = await this.bookingModel.findById(dto.bookingId);
      if(!booking) return new CustomError(404,'Booking not found');

      if(dto.status === 'success'){
        booking.status = 'paid';
        booking.paymentRef = dto.paymentRef;
        await booking.save();
        return new CustomResponse(200,'Payment success, booking confirmed', booking.toObject());
      } else {
        // payment failed → release seat
        await this.slotModel.findByIdAndUpdate(booking.slotId, { $inc: { seatsLeft: 1 } });
        booking.status = 'failed';
        booking.paymentRef = dto.paymentRef;
        await booking.save();
        return new CustomResponse(200,'Payment failed, seat released', booking.toObject());
      }
    }catch(e:any){ this.logger.error(e); return new CustomError(500,e?.message||'Confirm payment failed');}
  }


async myBookings(userId: string) {
  try {
    // validate
    if (!userId) return new CustomError(400, 'userId is required');
    if (!Types.ObjectId.isValid(userId)) return new CustomError(400, 'Invalid user id');

    // cast to ObjectId to avoid mismatch
    const uid = new Types.ObjectId(userId);

    const list = await this.bookingModel.find({ userId: uid })
      .populate({ path: 'serviceId', select: 'name durationMinutes price' })
      .populate({ path: 'slotId', select: 'start end' })
      .sort({ createdAt: -1 })
      .lean();

    // helpful info if empty
    if (!list || list.length === 0) {
      this.logger.debug(`myBookings: no bookings found for user ${userId}`);
      return new CustomResponse(200, 'No bookings found', []);
    }

    return new CustomResponse(200, 'Bookings fetched', list);
  } catch (e: any) {
    this.logger.error('myBookings error:', e);
    return new CustomError(500, e?.message || 'Fetch bookings failed');
  }
}


  // Cancel (before start) — refund flow not implemented
  async cancel(bookingId:string){
    try{
      const booking = await this.bookingModel.findById(bookingId);
      if(!booking) return new CustomError(404,'Booking not found');
      if(booking.status !== 'paid') return new CustomError(400,'Only paid bookings can be cancelled');
      // if already started?
      const slot = await this.slotModel.findById(booking.slotId);
      if(slot && slot.start <= new Date()) return new CustomError(400,'Cannot cancel after start');

      booking.status = 'cancelled';
      await booking.save();
      await this.slotModel.findByIdAndUpdate(booking.slotId, { $inc: { seatsLeft: 1 } });

      return new CustomResponse(200,'Booking cancelled', { cancelled:true });
    }catch(e:any){ return new CustomError(500,e?.message||'Cancel failed');}
  }

  // inside BookingsService class (src/bookings/bookings.service.ts)

// GET single slot by id (detailed)
async getSlotById(id: string) {
  try {
    if (!isValidObjectId(id)) return new CustomError(400, 'Invalid slot ID');

    const slot = await this.slotModel
      .findById(id)
      .populate({ path: 'serviceId', select: 'name price durationMinutes' })
      .lean();

    if (!slot) return new CustomError(404, 'Slot not found');

    return new CustomResponse(200, 'Slot fetched', slot);
  } catch (e: any) {
    this.logger.error('getSlotById error', e);
    return new CustomError(500, e?.message ?? 'Failed to fetch slot');
  }
}

// GET slots by serviceId and date (date = YYYY-MM-DD)
// imports needed at top of file:
// import { isValidObjectId, Types } from 'mongoose';

async getSlotsByServiceAndDate(serviceId: string, dateStr?: string) {
  try {
    // validate serviceId
    if (!serviceId || !isValidObjectId(serviceId)) return new CustomError(400, 'Invalid service ID');

    // Build base query
    const q: any = { serviceId: new Types.ObjectId(serviceId) };

    // Only active slots by default and with seats left (change if you want to show full slots too)
    q.active = true;
    q.seatsLeft = { $gt: 0 };

    // If dateStr provided — accept YYYY-MM or YYYY-MM-DD
    if (dateStr) {
      const raw = String(dateStr).trim();
      // month format: "YYYY-MM"
      const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
      const dayMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (monthMatch) {
        const year = Number(monthMatch[1]);
        const month = Number(monthMatch[2]) - 1; // JS months 0-11
        const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)); // first day of next month
        q.start = { $gte: start, $lt: end };
      } else if (dayMatch) {
        const day = raw.substring(0, 10); // YYYY-MM-DD
        const start = new Date(`${day}T00:00:00.000Z`);
        const end = new Date(`${day}T23:59:59.999Z`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return new CustomError(400, 'Invalid date format (use YYYY-MM or YYYY-MM-DD)');
        }
        q.start = { $gte: start, $lte: end };
      } else {
        return new CustomError(400, 'Invalid date format (use YYYY-MM or YYYY-MM-DD)');
      }
    } else {
      // no date: optionally filter to only upcoming slots (from now)
      q.start = { $gte: new Date() };
    }

    // Execute query
    const slots = await this.slotModel
      .find(q)
      .sort({ start: 1 })
      .populate({ path: 'serviceId', select: 'name price durationMinutes' })
      .lean();

    return new CustomResponse(200, 'Slots fetched', slots);
  } catch (e: any) {
    this.logger.error('getSlotsByServiceAndDate error', e);
    return new CustomError(500, e?.message ?? 'Failed to fetch slots');
  }
}


}
