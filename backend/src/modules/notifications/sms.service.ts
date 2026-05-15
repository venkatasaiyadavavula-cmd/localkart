import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly fast2smsApiKey: string | null = null;

  constructor() {
    if (process.env.FAST2SMS_API_KEY) {
      this.fast2smsApiKey = process.env.FAST2SMS_API_KEY;
      this.logger.log('Fast2SMS configured successfully.');
    } else {
      this.logger.warn('Fast2SMS API key not configured. SMS will be logged only.');
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      if (this.fast2smsApiKey) {
        const phone = this.formatPhoneNumber(to);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': this.fast2smsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: message,
            language: 'english',
            flash: 0,
            numbers: phone,
          }),
        });
        const data = await response.json();
        if (data.return === true) {
          this.logger.log(`SMS sent to ${to}`);
          return true;
        } else {
          this.logger.error(`Fast2SMS error: ${JSON.stringify(data)}`);
          return false;
        }
      } else {
        this.logger.log(`[MOCK SMS] To: ${to} - ${message}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (phone.startsWith('+91')) return phone.replace('+91', '');
    if (phone.startsWith('+')) return phone.slice(3);
    if (phone.length === 10) return phone;
    return phone;
  }
}
