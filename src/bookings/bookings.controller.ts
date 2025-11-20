import { Controller, Post, Body, Get, Param, Query, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { BulkSlotsDto } from './dto/bulk-slots.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller()
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  // ---- Admin Slot Management ----
  @Post('admin/slots')
  createSlot(@Body() dto: CreateSlotDto){ return this.svc.createSlot(dto); }

  @Post('admin/slots/bulk')
  bulkSlots(@Body() dto: BulkSlotsDto){ return this.svc.bulkCreateSlots(dto); }

  // ---- Public Availability ----
  // month format: "2025-09"
  @Get('availability/:serviceId')
  availability(@Param('serviceId') serviceId:string, @Query('month') month:string){
    return this.svc.availability(serviceId, month);
  }

  // ---- Booking & Payment ----
  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto){ return this.svc.createBooking(dto); }

  @Post('bookings/confirm')
  confirm(@Body() dto: ConfirmPaymentDto){ return this.svc.confirmPayment(dto); }

  @Get('bookings/user/:userId')
  my(@Param('userId') userId:string){ return this.svc.myBookings(userId); }

  @Get('bookings/details/:id')
  bookingDetails(@Param('id') id: string) {
    return this.svc.getBookingDetails(id);
  }

  @Delete('bookings/cancel-booking/:id')
  cancel(@Param('id') id:string){ return this.svc.cancel(id); }
   

  
}
