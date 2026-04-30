import { Injectable, Logger } from '@nestjs/common';
import twilio = require('twilio');

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: twilio.Twilio | null = null;

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    } else {
      this.logger.warn('Twilio credentials not configured. SMS will be logged only.');
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      if (this.twilioClient) {
        await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: this.formatPhoneNumber(to),
        });
        this.logger.log(`SMS sent to ${to}`);
      } else {
        this.logger.log(`[MOCK SMS] To: ${to} - ${message}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.length === 10) return `+91${phone}`;
    return phone;
  }
}
