"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
const email_service_1 = require("./email.service");
const whatsapp_service_1 = require("./whatsapp.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    smsService;
    emailService;
    whatsappService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(smsService, emailService, whatsappService) {
        this.smsService = smsService;
        this.emailService = emailService;
        this.whatsappService = whatsappService;
    }
    async sendCustomerNotification(userId, title, message) {
        this.logger.log(`[Customer ${userId}] ${title}: ${message}`);
    }
    async sendSellerNotification(sellerId, title, message) {
        this.logger.log(`[Seller ${sellerId}] ${title}: ${message}`);
    }
    async sendAdminNotification(title, message) {
        this.logger.log(`[Admin] ${title}: ${message}`);
    }
    async sendOrderOtp(phone, otp) {
        const message = `Your LocalKart order verification OTP is: ${otp}. Valid for 5 minutes.`;
        await this.smsService.sendSms(phone, message);
    }
    async sendDeliveryOtp(phone, otp) {
        const message = `Your LocalKart delivery OTP is: ${otp}. Share ONLY when you receive your order.`;
        await this.smsService.sendSms(phone, message);
    }
    async sendLoginOtp(phone, otp) {
        const message = `Your LocalKart login OTP is: ${otp}. Valid for 5 minutes.`;
        await this.smsService.sendSms(phone, message);
    }
    async sendWelcomeEmail(email, name) {
        const subject = 'Welcome to LocalKart!';
        const html = `<h1>Welcome ${name}!</h1><p>Thank you for joining LocalKart.</p>`;
        await this.emailService.sendEmail(email, subject, html);
    }
    async sendOrderConfirmationEmail(email, orderDetails) {
        const subject = `Order Confirmed - ${orderDetails.orderNumber}`;
        const html = `<h1>Order Confirmed</h1><p>Your order #${orderDetails.orderNumber} has been confirmed.</p>`;
        await this.emailService.sendEmail(email, subject, html);
    }
    async sendOrderPlacedWhatsApp(customerPhone, customerName, orderNumber, shopName, totalAmount, paymentMethod) {
        await this.whatsappService.sendOrderPlacedWithScamWarning(customerPhone, customerName, orderNumber, shopName, totalAmount, paymentMethod);
    }
    async sendOrderStatusWhatsApp(customerPhone, customerName, orderNumber, status) {
        await this.whatsappService.sendOrderStatusUpdate(customerPhone, customerName, orderNumber, status);
    }
    async sendNewOrderWhatsApp(sellerPhone, shopName, orderNumber, itemsSummary, totalAmount) {
        await this.whatsappService.sendNewOrderToSeller(sellerPhone, shopName, orderNumber, itemsSummary, totalAmount);
    }
    async sendCommissionReminderWhatsApp(sellerPhone, shopName, billDate, commissionAmount, fineAmount, daysOverdue) {
        await this.whatsappService.sendCommissionReminder(sellerPhone, shopName, billDate, commissionAmount, fineAmount, daysOverdue);
    }
    async sendWeeklyEarningsWhatsApp(sellerPhone, shopName, weekLabel, orderCount, grossEarnings, commission, netEarnings) {
        await this.whatsappService.sendWeeklyEarningsSummary(sellerPhone, shopName, weekLabel, orderCount, grossEarnings, commission, netEarnings);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sms_service_1.SmsService,
        email_service_1.EmailService,
        whatsapp_service_1.WhatsappService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map