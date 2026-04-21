import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../core/entities/transaction.entity';
import { Shop } from '../../core/entities/shop.entity';
import { Category } from '../../core/entities/category.entity';
import { ProductCategoryType } from '../../core/entities/product.entity';

@Injectable()
export class CommissionService {
  // Default commission rates
  private commissionRates: Record<ProductCategoryType, number> = {
    [ProductCategoryType.GROCERIES]: 2,
    [ProductCategoryType.FASHION]: 4,
    [ProductCategoryType.ELECTRONICS]: 3,
    [ProductCategoryType.HOME_ESSENTIALS]: 4,
    [ProductCategoryType.BEAUTY]: 5,
    [ProductCategoryType.ACCESSORIES]: 5,
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getCommissionSummary(period?: string) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (period) {
      const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : '365 days';
      queryBuilder.andWhere(`order.deliveredAt >= NOW() - INTERVAL '${interval}'`);
    }

    const summary = await queryBuilder
      .select('SUM(order.commissionAmount)', 'totalCommission')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .getRawOne();

    const pendingSettlements = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.transactions', 't', 't.type = :type', { type: TransactionType.SETTLEMENT })
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('t.id IS NULL')
      .select('SUM(order.totalAmount - order.commissionAmount)', 'pending')
      .getRawOne();

    return {
      totalCommission: summary?.totalCommission || 0,
      totalRevenue: summary?.totalRevenue || 0,
      orderCount: summary?.orderCount || 0,
      pendingSettlements: pendingSettlements?.pending || 0,
      currentRates: this.commissionRates,
    };
  }

  async getCommissionTransactions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { type: TransactionType.COMMISSION },
      relations: ['order', 'order.shop'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateCategoryCommission(categoryType: string, rate: number) {
    if (!Object.values(ProductCategoryType).includes(categoryType as ProductCategoryType)) {
      throw new NotFoundException('Invalid category type');
    }
    this.commissionRates[categoryType as ProductCategoryType] = rate;
    return { message: 'Commission rate updated', rates: this.commissionRates };
  }

  async settleShopEarnings(shopId: string) {
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const unsettledOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.transactions', 't', 't.type = :type', { type: TransactionType.SETTLEMENT })
      .where('order.shopId = :shopId', { shopId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('t.id IS NULL')
      .getMany();

    const totalSettlement = unsettledOrders.reduce(
      (sum, order) => sum + (order.totalAmount - order.commissionAmount),
      0,
    );

    if (totalSettlement === 0) {
      return { message: 'No pending settlements' };
    }

    // Create settlement transaction
    const settlement = this.transactionRepository.create({
      type: TransactionType.SETTLEMENT,
      status: TransactionStatus.SUCCESS,
      amount: totalSettlement,
      currency: 'INR',
      metadata: { shopId, orderIds: unsettledOrders.map(o => o.id) },
    });
    await this.transactionRepository.save(settlement);

    // Update shop total earnings
    shop.totalEarnings += totalSettlement;
    await this.shopRepository.save(shop);

    // In production, trigger payout via Razorpay or bank transfer

    return { message: 'Settlement processed', amount: totalSettlement };
  }
}
