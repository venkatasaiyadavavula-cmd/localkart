import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../core/entities/transaction.entity';
import { Shop } from '../../core/entities/shop.entity';
import { applyUnsettledOrderFilter } from '../payments/settlement-query.util';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async getEarningsSummary(ownerId: string, period?: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED });

    if (period) {
      const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : '365 days';
      queryBuilder.andWhere(`order.deliveredAt >= NOW() - INTERVAL '${interval}'`);
    }

    const totalEarnings = await queryBuilder
      .select('SUM(order.totalAmount - order.commissionAmount - order.deliveryCharge)', 'earnings')
      .getRawOne();

    const totalCommission = await queryBuilder
      .clone()
      .select('SUM(order.commissionAmount)', 'commission')
      .getRawOne();

    const orderCount = await queryBuilder.clone().getCount();

    const pendingSettlement = await applyUnsettledOrderFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.shopId = :shopId', { shopId: shop.id })
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED }),
    )
      .select('COALESCE(SUM(order.totalAmount - order.commissionAmount), 0)', 'pending')
      .getRawOne();

    const earningsVal = totalEarnings?.earnings ?? totalEarnings?.sum;
    const commissionVal = totalCommission?.commission ?? totalCommission?.sum;
    const pendingVal = pendingSettlement?.pending ?? pendingSettlement?.sum;

    return {
      totalEarnings: Number(earningsVal || 0),
      totalCommission: Number(commissionVal || 0),
      totalOrders: orderCount,
      pendingSettlement: Number(pendingVal || 0),
      availableForPayout: Number(shop.totalEarnings || 0),
    };
  }

  async getTransactions(ownerId: string, page: number, limit: number) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.order', 'order')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWeeklyEarnings(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const weeks: {
      weekLabel: string;
      orderCount: number;
      gross: number;
      commission: number;
      net: number;
    }[] = [];

    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const orders = await this.orderRepository.find({
        where: {
          shopId: shop.id,
          status: OrderStatus.DELIVERED,
        },
      });

      const weekOrders = orders.filter(
        (o) => o.deliveredAt && new Date(o.deliveredAt) >= weekStart && new Date(o.deliveredAt) <= weekEnd,
      );

      const gross = weekOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const commission = weekOrders.reduce((sum, o) => sum + Number(o.commissionAmount), 0);
      const net = gross - commission;

      weeks.push({
        weekLabel: `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        orderCount: weekOrders.length,
        gross,
        commission,
        net,
      });
    }

    const currentWeek = weeks[weeks.length - 1];
    const previousWeek = weeks[weeks.length - 2];
    const growth =
      previousWeek && previousWeek.net > 0
        ? Math.round(((currentWeek.net - previousWeek.net) / previousWeek.net) * 100)
        : 0;

    return {
      weeks,
      currentWeek,
      growth,
    };
  }

  async getPayouts(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return this.transactionRepository.find({
      where: {
        order: { shopId: shop.id },
        type: TransactionType.SETTLEMENT,
        status: TransactionStatus.SUCCESS,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
