import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';

@Module({
  providers: [NotificationsService, SmsService, EmailService, WhatsappService],
  exports:   [NotificationsService, SmsService, EmailService, WhatsappService],
})
export class NotificationsModule {}
