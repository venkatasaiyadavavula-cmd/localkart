import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
 
@Injectable()
export class WeeklyEarningsScheduler {
  private readonly logger = new Logger(WeeklyEarningsScheduler.name);
 
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(CommissionBill)
    private readonly billRepo: Repository<CommissionBill>,
    private readonly whatsappService: WhatsappService,
  ) {}
 
  // Every Friday 9 PM IST
  @Cron('0 21 * * 5', { timeZone: 'Asia/Kolkata' })
  async sendWeeklyEarnings() {
    this.logger.log('📊 Sending weekly earnings summaries...');
 
    const now      = new Date();
    const friday   = new Date(now);
    const monday   = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    friday.setHours(23, 59, 59, 999);
 
    const weekLabel = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
 
    const shops = await this.shopRepo.find({ where: { status: 'approved' as any } });
 
    let sent = 0;
    for (const shop of shops) {
      if (!shop.phone) continue;
 
      const orders = await this.orderRepo.find({
        where: {
          shopId:    shop.id,
          status:    OrderStatus.DELIVERED,
          createdAt: Between(monday, friday),
        },
      });
 
      if (orders.length === 0) continue;
 
      const grossEarnings = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
      const commission    = orders.reduce((s, o) => s + Number(o.commissionAmount ?? 0), 0);
      const netEarnings   = grossEarnings - commission;
 
      await this.whatsappService.sendWeeklyEarningsSummary(
        shop.phone,
        shop.name,
        weekLabel,
        orders.length,
        grossEarnings,
        commission,
        netEarnings,
      ).catch(e => this.logger.error(`Weekly earnings WA failed for ${shop.name}: ${e.message}`));
 
      sent++;
    }
 
    this.logger.log(`✅ Weekly earnings sent to ${sent} shops`);
  }
 
  // API: get earnings data for seller dashboard
  async getWeeklyEarningsData(shopId: string) {
    const weeks = [];
 
    for (let w = 0; w < 8; w++) {
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() - 6 - w * 7 + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
 
      const orders = await this.orderRepo.find({
        where: {
          shopId,
          status:    OrderStatus.DELIVERED,
          createdAt: Between(monday, sunday),
        },
      });
 
      const gross      = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
      const commission = orders.reduce((s, o) => s + Number(o.commissionAmount ?? 0), 0);
 
      weeks.unshift({
        weekLabel:   `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        orderCount:  orders.length,
        gross:       parseFloat(gross.toFixed(2)),
        commission:  parseFloat(commission.toFixed(2)),
        net:         parseFloat((gross - commission).toFixed(2)),
      });
    }
 
    const currentWeek = weeks[weeks.length - 1];
    const lastWeek    = weeks[weeks.length - 2];
    const growth      = lastWeek?.net > 0
      ? parseFloat((((currentWeek.net - lastWeek.net) / lastWeek.net) * 100).toFixed(1))
      : 0;
 
    return { weeks, growth, currentWeek };
  }
}
