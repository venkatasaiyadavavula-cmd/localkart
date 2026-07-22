import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CommissionBill, CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Shop } from '../../core/entities/shop.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
import razorpayInstance from '../../config/razorpay.config';
import {
  daysOverdueFromFridayDue,
  formatWeekLabel,
  getWeekEndingFriday,
  getWeekOrderRange,
  getWeekStartSaturday,
  toIstDateString,
  parseDateOnly,
} from './commission-week.util';
import { RAZORPAY_ORDER_TTL_MS } from './payments.config';
import { razorpayReceipt } from './razorpay-receipt.util';

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

  // ─── Friday 10 PM IST: generate weekly bill per shop ────────────
  @Cron('0 22 * * 5', { timeZone: 'Asia/Kolkata' })
  async generateWeeklyBills() {
    this.logger.log('⏰ Weekly commission bill generation started (Sat–Fri week)');

    const weekEndingFriday = getWeekEndingFriday(new Date());
    const shops = await this.shopRepo.find({ where: { status: 'approved' as any } });

    let created = 0;
    for (const shop of shops) {
      const bill = await this.generateWeeklyBillForShop(shop.id, weekEndingFriday);
      if (bill) created++;
    }

    this.logger.log(`✅ Weekly bills: ${created} created for week ending ${weekEndingFriday} (${shops.length} shops checked)`);
  }

  /** @deprecated Use generateWeeklyBills — kept for admin trigger compatibility */
  async generateDailyBills() {
    return this.generateWeeklyBills();
  }

  // ─── Daily 10:05 PM IST: fines on overdue weekly bills ───────────
  @Cron('5 22 * * *', { timeZone: 'Asia/Kolkata' })
  async applyDailyFines() {
    this.logger.log('💰 Applying fines to overdue weekly bills');

    const unpaidBills = await this.billRepo.find({
      where: [{ status: CommissionBillStatus.PENDING }, { status: CommissionBillStatus.OVERDUE }],
      relations: ['shop'],
    });

    for (const bill of unpaidBills) {
      const daysLate = daysOverdueFromFridayDue(bill.billDate);

      if (daysLate > 0) {
        bill.daysOverdue = daysLate;
        bill.fineAmount = daysLate * FINE_PER_DAY;
        bill.status = CommissionBillStatus.OVERDUE;
        await this.billRepo.save(bill);
      } else {
        bill.daysOverdue = 0;
        bill.fineAmount = 0;
        if (bill.status === CommissionBillStatus.OVERDUE) {
          bill.status = CommissionBillStatus.PENDING;
        }
        await this.billRepo.save(bill);
      }
    }
  }

  // ─── Daily 10:10 PM IST: reminders ─────────────────────────────
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
      const weekLabel = bill.weekStartDate
        ? formatWeekLabel(bill.weekStartDate, bill.billDate)
        : bill.billDate;
      this.logger.log(`📲 Reminder → ${bill.shop.name} | Week ${weekLabel} | Due: ₹${total}`);

      if (bill.shop?.phone) {
        this.whatsappService
          .sendCommissionReminder(
            bill.shop.contactPhone,
            bill.shop.name,
            weekLabel,
            Number(bill.commissionAmount),
            Number(bill.fineAmount),
            bill.daysOverdue,
          )
          .catch((e) => this.logger.error('WA commission reminder failed: ' + e.message));
      }
    }
  }

  // ─── Core: one weekly bill for shop, week ending Friday ─────────
  async generateWeeklyBillForShop(
    shopId: string,
    weekEndingFriday: string,
  ): Promise<CommissionBill | null> {
    const existing = await this.billRepo.findOne({ where: { shopId, billDate: weekEndingFriday } });
    if (existing) return existing;

    const weekStartDate = getWeekStartSaturday(weekEndingFriday);
    const { start, end } = getWeekOrderRange(weekEndingFriday);

    const orders = await this.orderRepo.find({
      where: {
        shopId,
        status: OrderStatus.DELIVERED,
        deliveredAt: Between(start, end),
      },
    });

    if (orders.length === 0) return null;

    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const commissionAmount = parseFloat(
      orders.reduce((sum, o) => sum + Number(o.commissionAmount), 0).toFixed(2),
    );
    const commissionPercent =
      totalOrderValue > 0
        ? parseFloat(((commissionAmount / totalOrderValue) * 100).toFixed(2))
        : 0;

    const bill = this.billRepo.create({
      shopId,
      billDate: weekEndingFriday,
      weekStartDate,
      orderCount: orders.length,
      totalOrderValue,
      commissionAmount,
      commissionPercent,
      fineAmount: 0,
      daysOverdue: 0,
      status: CommissionBillStatus.PENDING,
    });

    return this.billRepo.save(bill);
  }

  /** @deprecated Use generateWeeklyBillForShop */
  async generateBillForShop(shopId: string, date: string): Promise<CommissionBill | null> {
    const friday = getWeekEndingFriday(new Date(`${date}T12:00:00+05:30`));
    return this.generateWeeklyBillForShop(shopId, friday);
  }

  // ─── Create Razorpay order for commission payment ────────────
  async createCommissionPaymentOrder(shopId: string, billId: string) {
    const bill = await this.billRepo.findOne({
      where: { id: billId, shopId },
      relations: ['shop'],
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === CommissionBillStatus.PAID) throw new BadRequestException('Bill already paid');

    const totalDue = Number(bill.commissionAmount) + Number(bill.fineAmount);
    const weekLabel = bill.weekStartDate
      ? formatWeekLabel(bill.weekStartDate, bill.billDate)
      : bill.billDate;

    if (bill.razorpayOrderId) {
      const ageMs = Date.now() - new Date(bill.updatedAt).getTime();
      if (ageMs < RAZORPAY_ORDER_TTL_MS) {
        return {
          razorpayOrderId: bill.razorpayOrderId,
          amount: Math.round(totalDue * 100),
          currency: 'INR',
          key: process.env.RAZORPAY_KEY_ID,
          billDetails: {
            billDate: bill.billDate,
            weekStartDate: bill.weekStartDate,
            weekLabel,
            orderCount: bill.orderCount,
            commissionAmount: bill.commissionAmount,
            fineAmount: bill.fineAmount,
            totalDue,
            daysOverdue: bill.daysOverdue,
          },
        };
      }
    }

    const amountPaise = Math.round(totalDue * 100);

    const rzpOrder = await razorpayInstance.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: razorpayReceipt('comm_', bill.id),
      payment_capture: true,
      notes: {
        type: 'commission',
        billId: bill.id,
        shopId,
        billDate: bill.billDate,
        weekStartDate: bill.weekStartDate ?? '',
        weekLabel,
      },
    });

    await this.billRepo.update(bill.id, { razorpayOrderId: (rzpOrder as any).id });

    return {
      razorpayOrderId: (rzpOrder as any).id,
      amount: (rzpOrder as any).amount,
      currency: (rzpOrder as any).currency,
      key: process.env.RAZORPAY_KEY_ID,
      billDetails: {
        billDate: bill.billDate,
        weekStartDate: bill.weekStartDate,
        weekLabel,
        orderCount: bill.orderCount,
        commissionAmount: bill.commissionAmount,
        fineAmount: bill.fineAmount,
        totalDue,
        daysOverdue: bill.daysOverdue,
      },
    };
  }

  // ─── Verify commission payment ────────────────────────────────
  async verifyCommissionPayment(
    shopId: string,
    billId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
  ) {
    const bill = await this.billRepo.findOne({ where: { id: billId, shopId } });
    if (!bill) {
      throw new NotFoundException('Commission bill not found');
    }
    if (bill.status === CommissionBillStatus.PAID) {
      return { success: true, message: 'Commission payment already confirmed' };
    }

    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.billRepo.update(
      { id: billId, shopId },
      {
        status: CommissionBillStatus.PAID,
        razorpayPaymentId,
        paidAt: new Date(),
        fineAmount: 0,
        daysOverdue: 0,
      },
    );

    return { success: true, message: 'Commission payment confirmed' };
  }

  // ─── Get all bills for a shop (seller dashboard) ──────────────
  async getShopBills(shopId: string, page = 1, limit = 30) {
    const [bills, total] = await this.billRepo.findAndCount({
      where: { shopId },
      order: { billDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enriched = bills.map((b) => ({
      ...b,
      weekLabel: b.weekStartDate
        ? formatWeekLabel(b.weekStartDate, b.billDate)
        : b.billDate,
    }));

    const totalPending = bills
      .filter((b) => b.status !== CommissionBillStatus.PAID)
      .reduce((sum, b) => sum + Number(b.commissionAmount) + Number(b.fineAmount), 0);

    return { bills: enriched, total, totalPending, page, limit };
  }

  // ─── Admin: all overdue shops ─────────────────────────────────
  async getOverdueShops() {
    const bills = await this.billRepo.find({
      where: { status: CommissionBillStatus.OVERDUE },
      relations: ['shop', 'shop.owner'],
      order: { daysOverdue: 'DESC' },
    });
    bills.forEach((b) => delete b.shop?.owner?.password);
    return bills.map((b) => this.enrichBill(b));
  }

  // ─── Admin: paginated bills ───────────────────────────────────
  async getAdminBills(params: {
    status?: string;
    shopId?: string;
    week?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const where: {
      status?: CommissionBillStatus;
      shopId?: string;
      billDate?: string;
    } = {};

    if (params.status && params.status !== 'all') {
      if (!Object.values(CommissionBillStatus).includes(params.status as CommissionBillStatus)) {
        throw new BadRequestException(`Invalid bill status: ${params.status}`);
      }
      where.status = params.status as CommissionBillStatus;
    }
    if (params.shopId) {
      where.shopId = params.shopId;
    }
    if (params.week) {
      where.billDate = params.week;
    }

    const [bills, total] = await this.billRepo.findAndCount({
      where,
      relations: ['shop'],
      order: { billDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: bills.map((b) => this.enrichBill(b)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // ─── Admin: platform summary ──────────────────────────────────
  async getAdminSummary() {
    const weekEndingFriday = getWeekEndingFriday();
    const weekStartSaturday = getWeekStartSaturday(weekEndingFriday);
    const weekStart = parseDateOnly(weekStartSaturday);
    const monthPrefix = toIstDateString().slice(0, 7);

    const outstandingRow = await this.billRepo
      .createQueryBuilder('bill')
      .select(
        'COALESCE(SUM(bill.commissionAmount + bill.fineAmount), 0)',
        'total',
      )
      .where('bill.status IN (:...statuses)', {
        statuses: [CommissionBillStatus.PENDING, CommissionBillStatus.OVERDUE],
      })
      .getRawOne();

    const overdueBillCount = await this.billRepo.count({
      where: { status: CommissionBillStatus.OVERDUE },
    });

    const overdueShopsRow = await this.billRepo
      .createQueryBuilder('bill')
      .select('COUNT(DISTINCT bill.shopId)', 'count')
      .where('bill.status = :status', { status: CommissionBillStatus.OVERDUE })
      .getRawOne();

    const collectedWeekRow = await this.billRepo
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.commissionAmount), 0)', 'total')
      .where('bill.status = :paid', { paid: CommissionBillStatus.PAID })
      .andWhere('bill.paidAt >= :weekStart', { weekStart })
      .getRawOne();

    const collectedMonthRow = await this.billRepo
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.commissionAmount), 0)', 'total')
      .where('bill.status = :paid', { paid: CommissionBillStatus.PAID })
      .andWhere("TO_CHAR(bill.paidAt AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') = :month", {
        month: monthPrefix,
      })
      .getRawOne();

    const billsGeneratedThisWeek = await this.billRepo.count({
      where: { billDate: weekEndingFriday },
    });

    return {
      totalOutstanding: Number(outstandingRow?.total ?? 0),
      overdueBillCount,
      overdueShopCount: Number(overdueShopsRow?.count ?? 0),
      collectedThisWeek: Number(collectedWeekRow?.total ?? 0),
      collectedThisMonth: Number(collectedMonthRow?.total ?? 0),
      billsGeneratedThisWeek,
      currentWeekEndingFriday: weekEndingFriday,
    };
  }

  // ─── Admin: per-shop bill history ─────────────────────────────
  async getAdminShopBills(shopId: string, page = 1, limit = 30) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const [bills, total] = await this.billRepo.findAndCount({
      where: { shopId },
      relations: ['shop'],
      order: { billDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      shop: { id: shop.id, name: shop.name },
      data: bills.map((b) => this.enrichBill(b)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // ─── Admin: manual mark paid ──────────────────────────────────
  async markBillPaidAdmin(billId: string, paymentRef?: string, note?: string) {
    const bill = await this.billRepo.findOne({
      where: { id: billId },
      relations: ['shop'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    if (bill.status === CommissionBillStatus.PAID) {
      throw new BadRequestException('Bill is already paid');
    }

    await this.billRepo.update(billId, {
      status: CommissionBillStatus.PAID,
      paidAt: new Date(),
      fineAmount: 0,
      daysOverdue: 0,
      adminPaymentRef: paymentRef?.trim() || null,
      adminNote: note?.trim() || null,
    });

    const updated = await this.billRepo.findOne({
      where: { id: billId },
      relations: ['shop'],
    });

    return { success: true, bill: this.enrichBill(updated!) };
  }

  // ─── Admin: trigger fines job ─────────────────────────────────
  async applyFinesAdmin() {
    await this.applyDailyFines();
    const overdueBillCount = await this.billRepo.count({
      where: { status: CommissionBillStatus.OVERDUE },
    });
    return { success: true, overdueBillCount };
  }

  private enrichBill(bill: CommissionBill) {
    const commissionAmount = Number(bill.commissionAmount);
    const fineAmount = Number(bill.fineAmount);
    const isPaid = bill.status === CommissionBillStatus.PAID;

    return {
      id: bill.id,
      shopId: bill.shopId,
      shop: bill.shop ? { id: bill.shop.id, name: bill.shop.name } : null,
      billDate: bill.billDate,
      weekStartDate: bill.weekStartDate,
      weekLabel: bill.weekStartDate
        ? formatWeekLabel(bill.weekStartDate, bill.billDate)
        : bill.billDate,
      orderCount: bill.orderCount,
      totalOrderValue: Number(bill.totalOrderValue),
      commissionAmount,
      fineAmount: isPaid ? 0 : fineAmount,
      totalDue: isPaid ? 0 : commissionAmount + fineAmount,
      daysOverdue: isPaid ? 0 : bill.daysOverdue,
      status: bill.status,
      razorpayOrderId: bill.razorpayOrderId,
      razorpayPaymentId: bill.razorpayPaymentId,
      adminPaymentRef: bill.adminPaymentRef,
      adminNote: bill.adminNote,
      paidAt: bill.paidAt,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };
  }
}
