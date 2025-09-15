// src/notifications/notifications.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notificaions.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sendBookingEmails')
  async sendBookingEmails(@Body() payload: any) {
    try {
      await this.notificationsService.sendBookingEmails(payload);
      return { success: true };
    } catch (err) {
      throw new HttpException({ message: 'Failed to send emails', detail: err.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
