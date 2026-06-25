import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async sendCustomerNotification(userId: string, title: string, message: string) {
    // In production: Get user device tokens and send push notification
    this.logger.log(`[Customer ${userId}] ${title}: ${message}`);
  }

  async sendSellerNotification(sellerId: string, title: string, message: string) {
    // In production: Send push/email to seller
    this.logger.log(`[Seller ${sellerId}] ${title}: ${message}`);
  }

  async sendAdminNotification(title: string, message: string) {
    this.logger.log(`[Admin] ${title}: ${message}`);
  }

  async sendOrderOtp(phone: string, otp: string) {
    const message = `Your LocalKart order verification OTP is: ${otp}. Valid for 5 minutes.`;
    await this.smsService.sendOtp(phone, otp);
  }

  async sendDeliveryOtp(phone: string, otp: string) {
    const message = `Your LocalKart delivery confirmation OTP is: ${otp}. Share this with delivery partner only upon receiving order.`;
    await this.smsService.sendOtp(phone, otp);
  }

  async sendLoginOtp(phone: string, otp: string) {
    const message = `Your LocalKart login OTP is: ${otp}. Valid for 5 minutes.`;
    await this.smsService.sendOtp(phone, otp);
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.emailService.sendWelcomeEmail(email, name);
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: any) {
    await this.emailService.sendOrderConfirmationEmail(email, orderDetails);
  }
}
