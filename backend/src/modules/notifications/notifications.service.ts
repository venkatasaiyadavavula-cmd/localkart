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
    await this.smsService.sendSms(phone, message);
  }

  async sendDeliveryOtp(phone: string, otp: string) {
    const message = `Your LocalKart delivery confirmation OTP is: ${otp}. Share this with delivery partner only upon receiving order.`;
    await this.smsService.sendSms(phone, message);
  }

  async sendLoginOtp(phone: string, otp: string) {
    const message = `Your LocalKart login OTP is: ${otp}. Valid for 5 minutes.`;
    await this.smsService.sendSms(phone, message);
  }

  async sendWelcomeEmail(email: string, name: string) {
    const subject = 'Welcome to LocalKart!';
    const html = `<h1>Welcome ${name}!</h1><p>Thank you for joining LocalKart. Start exploring local shops near you.</p>`;
    await this.emailService.sendEmail(email, subject, html);
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: any) {
    const subject = `Order Confirmed - ${orderDetails.orderNumber}`;
    const html = `<h1>Order Confirmed</h1><p>Your order #${orderDetails.orderNumber} has been confirmed.</p>`;
    await this.emailService.sendEmail(email, subject, html);
  }
}
