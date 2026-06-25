import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsService: string;
  private readonly twilioAccountSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioPhoneNumber: string;
  private readonly fast2smsApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.smsService = this.configService.get('SMS_SERVICE') || 'console';
    this.twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    this.twilioAuthToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');
    this.fast2smsApiKey = this.configService.get('FAST2SMS_API_KEY');
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const message = `Your LocalKart verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

    try {
      switch (this.smsService) {
        case 'twilio':
          return await this.sendViaTwilio(phone, message);
        case 'fast2sms':
          return await this.sendViaFast2SMS(phone, message);
        default:
          return await this.sendViaConsole(phone, otp);
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phone}: ${error.message}`);
      // Fallback to console in production if SMS fails
      if (this.smsService !== 'console') {
        this.logger.warn('Falling back to console logging');
        return await this.sendViaConsole(phone, otp);
      }
      throw error;
    }
  }

  async sendViaTwilio(phone: string, message: string): Promise<boolean> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const twilio = require('twilio');
    const client = twilio(this.twilioAccountSid, this.twilioAuthToken);

    try {
      await client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phone,
      });
      this.logger.log(`OTP sent via Twilio to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Twilio error: ${error.message}`);
      throw error;
    }
  }

  async sendViaFast2SMS(phone: string, message: string): Promise<boolean> {
    if (!this.fast2smsApiKey) {
      throw new Error('Fast2SMS API key not configured');
    }

    try {
      const axios = require('axios');
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: phone.replace('+91', ''),
        },
        {
          headers: {
            authorization: this.fast2smsApiKey,
          },
        },
      );

      if (response.data.return === true) {
        this.logger.log(`OTP sent via Fast2SMS to ${phone}`);
        return true;
      } else {
        throw new Error(response.data.message || 'Fast2SMS failed');
      }
    } catch (error) {
      this.logger.error(`Fast2SMS error: ${error.message}`);
      throw error;
    }
  }

  async sendViaConsole(phone: string, otp: string): Promise<boolean> {
    this.logger.log(`📱 OTP for ${phone}: ${otp}`);
    this.logger.log(`⚠️  SMS Service: Console (Development Mode)`);
    return true;
  }

  async sendOrderConfirmation(phone: string, orderNumber: string): Promise<boolean> {
    const message = `Your order ${orderNumber} has been confirmed. Thank you for shopping with LocalKart!`;
    return await this.sendOtp(phone, message);
  }

  async sendDeliveryOtp(phone: string, otp: string): Promise<boolean> {
    const message = `Your delivery OTP is: ${otp}. Share this with the delivery person.`;
    return await this.sendOtp(phone, message);
  }
}
