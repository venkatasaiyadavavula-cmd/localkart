import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CommissionBill, CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Shop } from '../../core/entities/shop.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
import razorpayInstance from '../../config/razorpay.config';

const FINE_PER_DAY = 25;

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionBill)
    private readonly billRepo: Repository<CommissionBill>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly dataSource: DataSource,
    private readonly whatsappService: WhatsappService,
  ) {}

  // ─── Every day 10 PM: generate bill for each shop ────────────
  @Cron('0 22 * * *', { timeZone: 'Asia/Kolkata' })
  async generateDailyBills() {
    this.logger.log('⏰ Daily commission bill generation started');

    const today = new Date().toISOString().split('T')[0];

    const shops = await this.shopRepo.find({ where: { status: 'approved' as any } });

    for (const shop of shops) {
      await this.generateBillForShop(shop.id, today);
    }

    this.logger.log(`✅ Bills generated for ${shops.length} shops`);
  }

  // ─── Every day 10:05 PM: apply fines to overdue bills ────────
  @Cron('5 22 * * *', { timeZone: 'Asia/Kolkata' })
  async applyDailyFines() {
    this.logger.log('💰 Applying fines to overdue bills');

    const unpaidBills = await this.billRepo.find({
      where: { status: CommissionBillStatus.PENDING },
      relations: ['shop'],
    });

    for (const bill of unpaidBills) {
      const billDate  = new Date(bill.billDate);
      const today     = new Date();
      const msPerDay  = 1000 * 60 * 60 * 24;
      const daysLate  = Math.floor((today.getTime() - billDate.getTime()) / msPerDay);

      if (daysLate > 0) {
        bill.daysOverdue  = daysLate;
        bill.fineAmount   = daysLate * FINE_PER_DAY;
        bill.status       = CommissionBillStatus.OVERDUE;
        await this.billRepo.save(bill);
      }
    }
  }

  // ─── Every day 10:10 PM: send reminders ──────────────────────
  @Cron('10 22 * * *', { timeZone: 'Asia/Kolkata' })
  async sendReminders() {
    const unpaid = await this.billRepo.find({
      where: [
        { status: CommissionBillStatus.PENDING },
        { status: CommissionBillStatus.OVERDUE },
      ],
      relations: ['shop', 'shop.owner'],
    });

    for (const bill of unpaid) {
      const total = Number(bill.commissionAmount) + Number(bill.fineAmount);
      this.logger.log(`📲 Reminder → ${bill.shop.name} | Due: ₹${total}`);

      if (bill.shop?.phone) {
        this.whatsappService.sendCommissionReminder(
          bill.shop.contactPhone,
          bill.shop.name,
          bill.billDate,
          Number(bill.commissionAmount),
          Number(bill.fineAmount),
          bill.daysOverdue,
        ).catch((e) => this.logger.error('WA commission reminder failed: ' + e.message));
      }
    }
  }

  // ─── Core: generate bill for one shop on one date ────────────
  async generateBillForShop(shopId: string, date: string): Promise<CommissionBill | null> {
    // Skip if bill already exists for this date
    const existing = await this.billRepo.findOne({ where: { shopId, billDate: date } });
    if (existing) return existing;

    const startOfDay = new Date(date + 'T00:00:00+05:30');
    const endOfDay   = new Date(date + 'T23:59:59+05:30');

    const orders = await this.orderRepo.find({
      where: {
        shopId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    if (orders.length === 0) return null;

    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Use commissionAmount already stored on each order.
    // Rates are category-based: groceries 2%, electronics 3%,
    // fashion/home_essentials 4%, beauty/accessories 5%.
    const commissionAmount = parseFloat(
      orders.reduce((sum, o) => sum + Number(o.commissionAmount), 0).toFixed(2),
    );

    // Effective blended rate — stored for display only
    const commissionPercent = totalOrderValue > 0
      ? parseFloat(((commissionAmount / totalOrderValue) * 100).toFixed(2))
      : 0;

    const bill = this.billRepo.create({
      shopId,
      billDate: date,
      orderCount: orders.length,
      totalOrderValue,
      commissionAmount,
      commissionPercent,
      fineAmount: 0,
      status: CommissionBillStatus.PENDING,
    });

    return this.billRepo.save(bill);
  }

  // ─── Create Razorpay order for commission payment ────────────
  async createCommissionPaymentOrder(shopId: string, billId: string) {
    const bill = await this.billRepo.findOne({
      where: { id: billId, shopId },
      relations: ['shop'],
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === CommissionBillStatus.PAID) throw new BadRequestException('Bill already paid');

    const totalDue    = Number(bill.commissionAmount) + Number(bill.fineAmount);
    const amountPaise = Math.round(totalDue * 100);

    const rzpOrder = await razorpayInstance.orders.create({
      amount:          amountPaise,
      currency:        'INR',
      receipt:         `comm_${bill.id}`,
      payment_capture: 1,
      notes: {
        type:    'commission',
        billId:  bill.id,
        shopId,
        billDate: bill.billDate,
      },
    });

    await this.billRepo.update(bill.id, { razorpayOrderId: rzpOrder.id });

    return {
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      key:             process.env.RAZORPAY_KEY_ID,
      billDetails: {
        billDate:         bill.billDate,
        orderCount:       bill.orderCount,
        commissionAmount: bill.commissionAmount,
        fineAmount:       bill.fineAmount,
        totalDue,
        daysOverdue:      bill.daysOverdue,
      },
    };
  }

  // ─── Verify commission payment ────────────────────────────────
  async verifyCommissionPayment(
    shopId:     string,
    billId:     string,
    razorpayPaymentId:  string,
    razorpayOrderId:    string,
    razorpaySignature:  string,
  ) {
    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.billRepo.update(billId, {
      status:            CommissionBillStatus.PAID,
      razorpayPaymentId,
      paidAt:            new Date(),
    });

    return { success: true, message: 'Commission payment confirmed' };
  }

  // ─── Get all bills for a shop (seller dashboard) ──────────────
  async getShopBills(shopId: string, page = 1, limit = 30) {
    const [bills, total] = await this.billRepo.findAndCount({
      where: { shopId },
      order: { billDate: 'DESC' },
      skip:  (page - 1) * limit,
      take:  limit,
    });

    const totalPending = bills
      .filter(b => b.status !== CommissionBillStatus.PAID)
      .reduce((sum, b) => sum + Number(b.commissionAmount) + Number(b.fineAmount), 0);

    return { bills, total, totalPending, page, limit };
  }

  // ─── Admin: all overdue shops ─────────────────────────────────
  async getOverdueShops() {
    return this.billRepo.find({
      where:     { status: CommissionBillStatus.OVERDUE },
      relations: ['shop', 'shop.owner'],
      order:     { daysOverdue: 'DESC' },
    });
  }
}
