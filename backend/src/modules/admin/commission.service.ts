import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../core/entities/transaction.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { ProductCategoryType } from '../../core/entities/product.entity';
import { applyUnsettledOrderFilter } from '../payments/settlement-query.util';
import { CommissionRatesService } from '../catalog/commission-rates.service';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    private readonly commissionRatesService: CommissionRatesService,
  ) {}

  /** Delivered orders not yet included in a settlement transaction. */
  private unsettledOrdersQuery(shopId?: string) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (shopId) {
      qb.andWhere('order.shopId = :shopId', { shopId });
    }

    return applyUnsettledOrderFilter(qb);
  }

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

    const pendingSettlements = await this.unsettledOrdersQuery()
      .select('COALESCE(SUM(order.totalAmount - order.commissionAmount), 0)', 'pending')
      .getRawOne();

    return {
      totalCommission: Number(summary?.totalCommission || 0),
      totalRevenue: Number(summary?.totalRevenue || 0),
      orderCount: Number(summary?.orderCount || 0),
      pendingSettlements: Number(pendingSettlements?.pending || 0),
      currentRates: await this.commissionRatesService.getRatesMap(),
      shopEarnings: await this.getShopEarningsList(),
    };
  }

  async getShopEarningsList() {
    const shops = await this.shopRepository.find({
      where: { status: ShopStatus.APPROVED },
      order: { name: 'ASC' },
    });

    const results = [];
    for (const shop of shops) {
      const pendingRow = await this.unsettledOrdersQuery(shop.id)
        .select('COALESCE(SUM(order.totalAmount - order.commissionAmount), 0)', 'pending')
        .getRawOne();

      const lastSettlement = await this.transactionRepository
        .createQueryBuilder('t')
        .where('t.type = :type', { type: TransactionType.SETTLEMENT })
        .andWhere("t.metadata->>'shopId' = :shopId", { shopId: shop.id })
        .orderBy('t.createdAt', 'DESC')
        .getOne();

      results.push({
        id: shop.id,
        name: shop.name,
        totalEarnings: Number(shop.totalEarnings || 0),
        pendingSettlement: Number(pendingRow?.pending || 0),
        lastSettlement: lastSettlement?.createdAt ?? null,
      });
    }

    return results;
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

  async getCategoryCommissionRates() {
    return this.commissionRatesService.listCategoryRates();
  }

  async updateCategoryCommission(categoryType: string, rate: number) {
    if (!Object.values(ProductCategoryType).includes(categoryType as ProductCategoryType)) {
      throw new NotFoundException('Invalid category type');
    }
    return this.commissionRatesService.updateCategoryRate(
      categoryType as ProductCategoryType,
      rate,
    );
  }

  async settleShopEarnings(shopId: string) {
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const unsettledOrders = await this.unsettledOrdersQuery(shopId).getMany();

    const totalSettlement = unsettledOrders.reduce(
      (sum, order) => sum + (order.totalAmount - order.commissionAmount),
      0,
    );

    if (totalSettlement === 0) {
      return { message: 'No pending settlements' };
    }

    const settlement = this.transactionRepository.create({
      type: TransactionType.SETTLEMENT,
      status: TransactionStatus.SUCCESS,
      amount: totalSettlement,
      currency: 'INR',
      metadata: { shopId, orderIds: unsettledOrders.map((o) => o.id) },
    });
    await this.transactionRepository.save(settlement);

    shop.totalEarnings += totalSettlement;
    await this.shopRepository.save(shop);

    return { message: 'Settlement processed', amount: totalSettlement };
  }
}
