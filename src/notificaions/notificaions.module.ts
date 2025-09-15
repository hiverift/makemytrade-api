// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsController } from './notificaions.controller';
import { NotificationsService } from './notificaions.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
