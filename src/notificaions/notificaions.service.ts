// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { userTemplateHtml,consultantTemplateHtml } from './template/template';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // configure transporter via env vars
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"Your App Name" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return info;
  }

  async sendBookingEmails(payload: any) {
    const { bookingId, serviceName, date, slotLabel, amount, user, consultant } = payload;

    if (!user?.email) throw new Error('User email required');
    // send to user
    const userHtml = userTemplateHtml({ bookingId, serviceName, date, slotLabel, amount, user, consultant });
    await this.sendMail(user.email, `Booking Confirmed: ${serviceName}`, userHtml);

    // send to consultant if present
    if (consultant?.email) {
      const consultantHtml = consultantTemplateHtml({ bookingId, serviceName, date, slotLabel, amount, user, consultant });
      await this.sendMail(consultant.email, `New Booking: ${serviceName}`, consultantHtml);
    }

    return true;
  }
}
