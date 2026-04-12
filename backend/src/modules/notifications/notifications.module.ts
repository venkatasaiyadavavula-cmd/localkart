import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

@Module({
  providers: [NotificationsService, SmsService, EmailService],
  exports: [NotificationsService, SmsService, EmailService],
})
export class NotificationsModule {}
