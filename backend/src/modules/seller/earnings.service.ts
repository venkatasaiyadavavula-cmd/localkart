import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../core/entities/transaction.entity';
import { Shop } from '../../core/entities/shop.entity';

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

    const pendingSettlement = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.transactions', 'transaction', 'transaction.type = :type', { type: TransactionType.SETTLEMENT })
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('transaction.id IS NULL')
      .select('SUM(order.totalAmount - order.commissionAmount)', 'pending')
      .getRawOne();

    return {
      totalEarnings: totalEarnings?.earnings || 0,
      totalCommission: totalCommission?.commission || 0,
      totalOrders: orderCount,
      pendingSettlement: pendingSettlement?.pending || 0,
      availableForPayout: shop.totalEarnings || 0,
    };
  }

  async getTransactions(ownerId: string, page: number, limit: number) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { order: { shopId: shop.id } },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
