import { Controller, Post, Body, Param, Get, Query, Req, Patch, Delete } from '@nestjs/common';
import { OrdersService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/create-razorpay-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req?.user?.id;
    return await this.ordersService.createOrder(dto, userId);
  }

  @Post(':id/pay')
  async createRazorpayOrder(@Param('id') id: string, @Body() dto: CreateRazorpayOrderDto) {
    return await this.ordersService.createRazorpayOrder(id, dto);
  }

  @Post(':id/verify')
  async verifyPayment(@Param('id') id: string, @Body() dto: VerifyPaymentDto) {
    return await this.ordersService.verifyAndConfirmPayment(id, dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.ordersService.findById(id);
  }

  @Get()
  async list(@Query('limit') limit = '20', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.list(l, s);
  }

  // NEW: fetch by user
  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string, @Query('limit') limit = '20', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.findByUser(userId, l, s);
  }

  // NEW: fetch by course/webinar/appointment
  @Get('course/:courseId')
  async getByCourse(@Param('courseId') courseId: string, @Query('limit') limit = '20', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.findByCourse(courseId, l, s);
  }

  @Get('webinar/:webinarId')
  async getByWebinar(@Param('webinarId') webinarId: string, @Query('limit') limit = '20', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.findByWebinar(webinarId, l, s);
  }

  @Get('appointment/:appointmentId')
  async getByAppointment(@Param('appointmentId') appointmentId: string, @Query('limit') limit = '20', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.findByAppointment(appointmentId, l, s);
  }

  // PAYMENT history endpoints
  @Get(':id/payments')
  async paymentsForOrder(@Param('id') id: string) {
    return await this.ordersService.getPaymentHistoryForOrder(id);
  }

  @Get('user/:userId/payments')
  async paymentsForUser(@Param('userId') userId: string, @Query('limit') limit = '50', @Query('skip') skip = '0') {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.ordersService.getPaymentHistoryForUser(userId, l, s);
  }

  // Update
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return await this.ordersService.updateOrder(id, dto);
  }

  // Delete
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.ordersService.deleteOrder(id);
  }

  // Refund
  @Post(':id/refund')
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return await this.ordersService.refundPayment(id, dto);
  }
}
