import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
 
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token   = process.env.WHATSAPP_TOKEN;
  private readonly phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
 
  private get enabled() {
    return !!(this.token && this.phoneId);
  }
 
  private async send(to: string, message: string): Promise<boolean> {
    const phone = to.startsWith('+') ? to.replace('+', '') : `91${to}`;
 
    if (!this.enabled) {
      this.logger.log(`[MOCK WA] → ${phone}\n${message}`);
      return true;
    }
 
    try {
      await axios.post(
        `https://graph.facebook.com/v19.0/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`✅ WhatsApp sent to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`❌ WhatsApp failed to ${phone}: ${err.message}`);
      return false;
    }
  }
 
  // ─── Order placed — customer scam warning (3 languages) ──────
  async sendOrderPlacedWithScamWarning(
    customerPhone: string,
    customerName:  string,
    orderNumber:   string,
    shopName:      string,
    totalAmount:   number,
    paymentMethod: 'cod' | 'razorpay',
  ): Promise<boolean> {
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
 
  // ─── Order status update — customer ──────────────────────────
  async sendOrderStatusUpdate(
    customerPhone: string,
    customerName:  string,
    orderNumber:   string,
    status:        string,
  ): Promise<boolean> {
    const STATUS_MSG: Record<string, string> = {
      confirmed:          `✅ Your order #${orderNumber} has been *confirmed* by the shop!`,
      processing:         `🔄 Your order #${orderNumber} is being *prepared*.`,
      ready_for_pickup:   `📦 Your order #${orderNumber} is *ready* and will be picked up for delivery soon.`,
      out_for_delivery:   `🚴 Your order #${orderNumber} is *out for delivery*! Be available to receive it.\n\n⚠️ *తెలుగు:* OTP లేకుండా డెలివరీ బాయ్‌కి డబ్బులు ఇవ్వకండి.\n⚠️ *हिंदी:* OTP के बिना पैसे न दें।`,
      delivered:          `🎉 Your order #${orderNumber} has been *delivered*! Enjoy your purchase.`,
      cancelled:          `❌ Your order #${orderNumber} has been *cancelled*. Refund (if any) in 3–5 days.`,
    };
 
    const text = STATUS_MSG[status];
    if (!text) return false;
 
    const msg = `🛒 *LocalKart Order Update*\n\nHello ${customerName},\n\n${text}`;
    return this.send(customerPhone, msg);
  }
 
  // ─── New order alert — seller ─────────────────────────────────
  async sendNewOrderToSeller(
    sellerPhone:  string,
    shopName:     string,
    orderNumber:  string,
    itemsSummary: string,
    totalAmount:  number,
  ): Promise<boolean> {
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
 
  // ─── Commission reminder — seller ────────────────────────────
  async sendCommissionReminder(
    sellerPhone:      string,
    shopName:         string,
    billDate:         string,
    commissionAmount: number,
    fineAmount:       number,
    daysOverdue:      number,
  ): Promise<boolean> {
    const total    = commissionAmount + fineAmount;
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
 
  // ─── Weekly earnings summary — seller ────────────────────────
  async sendWeeklyEarningsSummary(
    sellerPhone:  string,
    shopName:     string,
    weekLabel:    string,
    orderCount:   number,
    grossEarnings:number,
    commission:   number,
    netEarnings:  number,
  ): Promise<boolean> {
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

  /** OTP for login / verification */
  async sendOtpMessage(phone: string, otp: string): Promise<boolean> {
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
}
