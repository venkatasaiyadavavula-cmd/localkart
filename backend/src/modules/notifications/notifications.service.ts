import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
 
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
 
  constructor(
    private readonly smsService:      SmsService,
    private readonly emailService:    EmailService,
    private readonly whatsappService: WhatsappService,
  ) {}
 
  async sendCustomerNotification(userId: string, title: string, message: string) {
    this.logger.log(`[Customer ${userId}] ${title}: ${message}`);
  }
 
  async sendSellerNotification(sellerId: string, title: string, message: string) {
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
    const message = `Your LocalKart delivery OTP is: ${otp}. Share ONLY when you receive your order.`;
    await this.smsService.sendSms(phone, message);
  }
 
  async sendLoginOtp(phone: string, otp: string) {
    const message = `Your LocalKart login OTP is: ${otp}. Valid for 5 minutes.`;
    await this.smsService.sendSms(phone, message);
  }
 
  async sendWelcomeEmail(email: string, name: string) {
    const subject = 'Welcome to LocalKart!';
    const html    = `<h1>Welcome ${name}!</h1><p>Thank you for joining LocalKart.</p>`;
    await this.emailService.sendEmail(email, subject, html);
  }
 
  async sendOrderConfirmationEmail(email: string, orderDetails: any) {
    const subject = `Order Confirmed - ${orderDetails.orderNumber}`;
    const html    = `<h1>Order Confirmed</h1><p>Your order #${orderDetails.orderNumber} has been confirmed.</p>`;
    await this.emailService.sendEmail(email, subject, html);
  }
 
  // ─── WhatsApp: order placed (customer) ───────────────────────
  async sendOrderPlacedWhatsApp(
    customerPhone: string,
    customerName:  string,
    orderNumber:   string,
    shopName:      string,
    totalAmount:   number,
    paymentMethod: 'cod' | 'razorpay',
  ) {
    await this.whatsappService.sendOrderPlacedWithScamWarning(
      customerPhone, customerName, orderNumber, shopName, totalAmount, paymentMethod,
    );
  }
 
  // ─── WhatsApp: order status change (customer) ────────────────
  async sendOrderStatusWhatsApp(
    customerPhone: string,
    customerName:  string,
    orderNumber:   string,
    status:        string,
  ) {
    await this.whatsappService.sendOrderStatusUpdate(
      customerPhone, customerName, orderNumber, status,
    );
  }

  async sendReturnStatusWhatsApp(
    customerPhone: string,
    customerName: string,
    orderNumber: string,
    event: 'approved' | 'rejected' | 'refunded',
    detail?: string,
  ) {
    await this.whatsappService.sendReturnStatusUpdate(
      customerPhone, customerName, orderNumber, event, detail,
    );
  }

  async sendReturnStatusEmail(
    email: string,
    orderNumber: string,
    event: 'approved' | 'rejected' | 'refunded',
    detail?: string,
  ) {
    const subjects: Record<string, string> = {
      approved: `Return approved — Order #${orderNumber}`,
      rejected: `Return not approved — Order #${orderNumber}`,
      refunded: `Refund initiated — Order #${orderNumber}`,
    };
    const bodies: Record<string, string> = {
      approved: `<p>Your return request for order <strong>#${orderNumber}</strong> has been approved.</p>`,
      rejected: `<p>Your return request for order <strong>#${orderNumber}</strong> was not approved.${detail ? ` Reason: ${detail}` : ''}</p>`,
      refunded: `<p>Refund for order <strong>#${orderNumber}</strong> has been initiated. Amount: ₹${detail ?? '—'}. It may take 3–5 business days to reflect.</p>`,
    };
    const subject = subjects[event] ?? `Return update — Order #${orderNumber}`;
    const html = `<h1>LocalKart Return Update</h1>${bodies[event] ?? ''}`;
    await this.emailService.sendEmail(email, subject, html);
  }

  async sendReturnStatusWhatsAppToSeller(
    sellerPhone: string,
    shopName: string,
    orderNumber: string,
    event: 'approved' | 'rejected' | 'refunded',
    detail?: string,
  ) {
    await this.whatsappService.sendReturnStatusUpdateToSeller(
      sellerPhone,
      shopName,
      orderNumber,
      event,
      detail,
    );
  }

  async sendReturnStatusEmailToSeller(
    email: string,
    shopName: string,
    orderNumber: string,
    event: 'approved' | 'rejected' | 'refunded',
    detail?: string,
  ) {
    const subjects: Record<string, string> = {
      approved: `Return approved — Order #${orderNumber} (${shopName})`,
      rejected: `Return rejected — Order #${orderNumber} (${shopName})`,
      refunded: `Refund processed — Order #${orderNumber} (${shopName})`,
    };
    const bodies: Record<string, string> = {
      approved: `<p>Admin approved the return for order <strong>#${orderNumber}</strong> at <strong>${shopName}</strong>. Arrange pickup and update stock when items are received. Commission may be adjusted when the refund is processed.</p>`,
      rejected: `<p>Admin rejected the return for order <strong>#${orderNumber}</strong> at <strong>${shopName}</strong>. The order stays delivered.${detail ? ` Note: ${detail}` : ''}</p>`,
      refunded: `<p>Admin processed a refund of <strong>₹${detail ?? '—'}</strong> for order <strong>#${orderNumber}</strong> at <strong>${shopName}</strong>. Check commission bills for settlement impact.</p>`,
    };
    const subject = subjects[event] ?? `Return update — Order #${orderNumber}`;
    const html = `<h1>LocalKart Seller Return Update</h1>${bodies[event] ?? ''}`;
    await this.emailService.sendEmail(email, subject, html);
  }
 
  // ─── WhatsApp: new order alert (seller) ──────────────────────
  async sendNewOrderWhatsApp(
    sellerPhone:  string,
    shopName:     string,
    orderNumber:  string,
    itemsSummary: string,
    totalAmount:  number,
  ) {
    await this.whatsappService.sendNewOrderToSeller(
      sellerPhone, shopName, orderNumber, itemsSummary, totalAmount,
    );
  }
 
  // ─── WhatsApp: commission reminder (seller) ──────────────────
  async sendCommissionReminderWhatsApp(
    sellerPhone:      string,
    shopName:         string,
    billDate:         string,
    commissionAmount: number,
    fineAmount:       number,
    daysOverdue:      number,
  ) {
    await this.whatsappService.sendCommissionReminder(
      sellerPhone, shopName, billDate, commissionAmount, fineAmount, daysOverdue,
    );
  }
 
  // ─── WhatsApp: weekly earnings summary (seller) ──────────────
  async sendWeeklyEarningsWhatsApp(
    sellerPhone:   string,
    shopName:      string,
    weekLabel:     string,
    orderCount:    number,
    grossEarnings: number,
    commission:    number,
    netEarnings:   number,
  ) {
    await this.whatsappService.sendWeeklyEarningsSummary(
      sellerPhone, shopName, weekLabel, orderCount, grossEarnings, commission, netEarnings,
    );
  }
}
