import { Controller, Post, Body, Get, Param, Query, Delete ,Patch} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { BulkSlotsDto } from './dto/bulk-slots.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { UpdateSlotDto } from './entities/update-slot.dto';

@Controller()
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

 
  @Post('admin/slots')
  createSlot(@Body() dto: CreateSlotDto){ return this.svc.createSlot(dto); }

  @Post('admin/slots/bulk')
  bulkSlots(@Body() dto: BulkSlotsDto){ return this.svc.bulkCreateSlots(dto); }

  @Patch('admin/slots/:id')
  updateSlot(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.svc.updateSlot(id, dto);
  }

  // 🔹 DELETE particular slot
  @Delete('admin/slots/:id')
  deleteSlot(@Param('id') id: string) {
    return this.svc.deleteSlot(id);
  }


  @Get('availability/:serviceId')
  availability(@Param('serviceId') serviceId:string, @Query('month') month:string){
    return this.svc.availability(serviceId, month);
  }

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
