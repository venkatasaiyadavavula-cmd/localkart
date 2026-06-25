import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || 'noreply@localkart.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to LocalKart!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3D5AF1;">Welcome ${name}!</h1>
        <p>Thank you for joining LocalKart. Start exploring local shops near you.</p>
        <p>Best regards,<br>The LocalKart Team</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: any): Promise<void> {
    const subject = `Order Confirmed - ${orderDetails.orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3D5AF1;">Order Confirmed</h1>
        <p>Your order #${orderDetails.orderNumber} has been confirmed.</p>
        <p>Total Amount: ₹${orderDetails.totalAmount}</p>
        <p>Best regards,<br>The LocalKart Team</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your LocalKart Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3D5AF1;">Verification Code</h1>
        <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
    await this.sendEmail(email, subject, html);
  }
}
