"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let WhatsappService = WhatsappService_1 = class WhatsappService {
    logger = new common_1.Logger(WhatsappService_1.name);
    token = process.env.WHATSAPP_TOKEN;
    phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    get enabled() {
        return !!(this.token && this.phoneId);
    }
    async send(to, message) {
        const phone = to.startsWith('+') ? to.replace('+', '') : `91${to}`;
        if (!this.enabled) {
            this.logger.log(`[MOCK WA] → ${phone}\n${message}`);
            return true;
        }
        try {
            await axios_1.default.post(`https://graph.facebook.com/v19.0/${this.phoneId}/messages`, {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: message },
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`✅ WhatsApp sent to ${phone}`);
            return true;
        }
        catch (err) {
            this.logger.error(`❌ WhatsApp failed to ${phone}: ${err.message}`);
            return false;
        }
    }
    async sendOrderPlacedWithScamWarning(customerPhone, customerName, orderNumber, shopName, totalAmount, paymentMethod) {
        const isCod = paymentMethod === 'cod';
        const msg = [
            `🛒 *LocalKart — Order Confirmed!*`,
            `Hello ${customerName},`,
            ``,
            `✅ Order *#${orderNumber}* placed at *${shopName}*`,
            `💰 Amount: *₹${totalAmount}*`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━`,
            `⚠️ *IMPORTANT — Please Read*`,
            `━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `🇬🇧 *English:*`,
            isCod
                ? `Pay ONLY through the LocalKart app. Do NOT give cash directly to the delivery person before verifying your order. Always confirm your OTP before paying.`
                : `Your payment is already done online. Do NOT pay again to the delivery person under any circumstances.`,
            ``,
            `🇮🇳 *हिंदी:*`,
            isCod
                ? `भुगतान केवल LocalKart ऐप के माध्यम से करें। OTP verify किए बिना डिलीवरी बॉय को सीधे नकद न दें।`
                : `आपका भुगतान ऑनलाइन हो चुका है। किसी भी हालत में डिलीवरी पर्सन को दोबारा पैसे न दें।`,
            ``,
            `🇮🇳 *తెలుగు:*`,
            isCod
                ? `చెల్లింపు LocalKart యాప్ ద్వారా మాత్రమే చేయండి. OTP verify చేయకుండా డెలివరీ బాయ్‌కి నేరుగా నగదు ఇవ్వకండి.`
                : `మీ చెల్లింపు ఆన్‌లైన్‌లో పూర్తయింది. ఏ కారణంతోనూ డెలివరీ పర్సన్‌కి మళ్ళీ డబ్బులు ఇవ్వకండి.`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━`,
            `📞 Fraud? Call 1800-XXX-XXXX`,
            `🔗 Track order in the LocalKart app`,
        ].join('\n');
        return this.send(customerPhone, msg);
    }
    async sendOrderStatusUpdate(customerPhone, customerName, orderNumber, status) {
        const STATUS_MSG = {
            confirmed: `✅ Your order #${orderNumber} has been *confirmed* by the shop!`,
            processing: `🔄 Your order #${orderNumber} is being *prepared*.`,
            ready_for_pickup: `📦 Your order #${orderNumber} is *ready* and will be picked up for delivery soon.`,
            out_for_delivery: `🚴 Your order #${orderNumber} is *out for delivery*! Be available to receive it.\n\n⚠️ *తెలుగు:* OTP లేకుండా డెలివరీ బాయ్‌కి డబ్బులు ఇవ్వకండి.\n⚠️ *हिंदी:* OTP के बिना पैसे न दें।`,
            delivered: `🎉 Your order #${orderNumber} has been *delivered*! Enjoy your purchase.`,
            cancelled: `❌ Your order #${orderNumber} has been *cancelled*. Refund (if any) in 3–5 days.`,
        };
        const text = STATUS_MSG[status];
        if (!text)
            return false;
        const msg = `🛒 *LocalKart Order Update*\n\nHello ${customerName},\n\n${text}`;
        return this.send(customerPhone, msg);
    }
    async sendNewOrderToSeller(sellerPhone, shopName, orderNumber, itemsSummary, totalAmount) {
        const msg = [
            `🔔 *New Order — ${shopName}*`,
            ``,
            `📋 Order: *#${orderNumber}*`,
            `🛍️ Items: ${itemsSummary}`,
            `💰 Total: *₹${totalAmount}*`,
            ``,
            `Reply *ACCEPT* or open LocalKart Seller app to manage this order.`,
            ``,
            `⏰ Please confirm within 15 minutes.`,
        ].join('\n');
        return this.send(sellerPhone, msg);
    }
    async sendCommissionReminder(sellerPhone, shopName, billDate, commissionAmount, fineAmount, daysOverdue) {
        const total = commissionAmount + fineAmount;
        const isOverdue = daysOverdue > 0;
        const msg = [
            isOverdue
                ? `⚠️ *LocalKart — Commission Overdue!*`
                : `💳 *LocalKart — Commission Due*`,
            ``,
            `Shop: *${shopName}*`,
            `Date: ${billDate}`,
            `Commission: ₹${commissionAmount.toFixed(2)}`,
            ...(fineAmount > 0 ? [`Late fine (${daysOverdue}d × ₹25): ₹${fineAmount}`] : []),
            ``,
            `*Total Due: ₹${total.toFixed(2)}*`,
            ``,
            `Pay now in LocalKart Seller app → Commission Bills`,
            ``,
            isOverdue
                ? `❗ Fine increases ₹25 every day until paid.`
                : `⏰ Pay by midnight to avoid ₹25/day fine.`,
        ].join('\n');
        return this.send(sellerPhone, msg);
    }
    async sendWeeklyEarningsSummary(sellerPhone, shopName, weekLabel, orderCount, grossEarnings, commission, netEarnings) {
        const msg = [
            `📊 *LocalKart — Weekly Summary*`,
            ``,
            `Shop: *${shopName}*`,
            `Week: ${weekLabel}`,
            ``,
            `📦 Orders: *${orderCount}*`,
            `💰 Gross: ₹${grossEarnings.toFixed(2)}`,
            `📉 Commission: -₹${commission.toFixed(2)}`,
            `✅ *Net Earnings: ₹${netEarnings.toFixed(2)}*`,
            ``,
            `Keep it up! 🚀 View details in the seller app.`,
        ].join('\n');
        return this.send(sellerPhone, msg);
    }
    async sendOtpMessage(phone, otp) {
        const msg = [
            `🔐 *LocalKart OTP Verification*`,
            ``,
            `Your OTP is: *${otp}*`,
            `Valid for 5 minutes. Do NOT share with anyone.`,
            ``,
            `🇮🇳 *తెలుగు:* మీ OTP: *${otp}* — ఎవరికీ చెప్పకండి.`,
            `🇮🇳 *हिंदी:* आपका OTP: *${otp}* — किसी को न बताएं।`,
        ].join('\n');
        return this.send(phone, msg);
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map