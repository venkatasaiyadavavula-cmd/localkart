import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged only.');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@localkart.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}`);
      } else {
        this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }
}
