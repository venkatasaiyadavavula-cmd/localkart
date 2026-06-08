import { SmsService } from './sms.service';
import { EmailService } from './email.service';
export declare class NotificationsService {
    private readonly smsService;
    private readonly emailService;
    private readonly logger;
    constructor(smsService: SmsService, emailService: EmailService);
    sendCustomerNotification(userId: string, title: string, message: string): Promise<void>;
    sendSellerNotification(sellerId: string, title: string, message: string): Promise<void>;
    sendAdminNotification(title: string, message: string): Promise<void>;
    sendOrderOtp(phone: string, otp: string): Promise<void>;
    sendDeliveryOtp(phone: string, otp: string): Promise<void>;
    sendLoginOtp(phone: string, otp: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendOrderConfirmationEmail(email: string, orderDetails: any): Promise<void>;
}
