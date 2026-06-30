import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
export declare class NotificationsService {
    private readonly smsService;
    private readonly emailService;
    private readonly whatsappService;
    private readonly logger;
    constructor(smsService: SmsService, emailService: EmailService, whatsappService: WhatsappService);
    sendCustomerNotification(userId: string, title: string, message: string): Promise<void>;
    sendSellerNotification(sellerId: string, title: string, message: string): Promise<void>;
    sendAdminNotification(title: string, message: string): Promise<void>;
    sendOrderOtp(phone: string, otp: string): Promise<void>;
    sendDeliveryOtp(phone: string, otp: string): Promise<void>;
    sendLoginOtp(phone: string, otp: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendOrderConfirmationEmail(email: string, orderDetails: any): Promise<void>;
    sendOrderPlacedWhatsApp(customerPhone: string, customerName: string, orderNumber: string, shopName: string, totalAmount: number, paymentMethod: 'cod' | 'razorpay'): Promise<void>;
    sendOrderStatusWhatsApp(customerPhone: string, customerName: string, orderNumber: string, status: string): Promise<void>;
    sendNewOrderWhatsApp(sellerPhone: string, shopName: string, orderNumber: string, itemsSummary: string, totalAmount: number): Promise<void>;
    sendCommissionReminderWhatsApp(sellerPhone: string, shopName: string, billDate: string, commissionAmount: number, fineAmount: number, daysOverdue: number): Promise<void>;
    sendWeeklyEarningsWhatsApp(sellerPhone: string, shopName: string, weekLabel: string, orderCount: number, grossEarnings: number, commission: number, netEarnings: number): Promise<void>;
}
