import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import {
  ReturnRequest,
  ReturnStatus,
} from '../../core/entities/return-request.entity';
import {
  calculateTrendPercent,
  getPeriodRanges,
  normalizeDashboardPeriod,
} from './admin-dashboard.util';

export interface DashboardActivityItem {
  id: string;
  type: 'order' | 'shop' | 'product' | 'user';
  description: string;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepository: Repository<ReturnRequest>,
  ) {}

  async getDashboardStats(periodInput?: string) {
    const period = normalizeDashboardPeriod(periodInput);
    const ranges = getPeriodRanges(period);

    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      activeShops,
      newShopsCurrent,
      newShopsPrevious,
      totalCustomers,
      newCustomersCurrent,
      newCustomersPrevious,
      pendingShops,
      pendingProducts,
      openDisputes,
      recentActivity,
    ] = await Promise.all([
      this.sumDeliveredRevenue(ranges.current, true),
      this.sumDeliveredRevenue(ranges.previous, false),
      this.countDeliveredOrders(ranges.current, true),
      this.countDeliveredOrders(ranges.previous, false),
      this.shopRepository.count({ where: { status: ShopStatus.APPROVED } }),
      this.countShopsCreatedInRange(ranges.current, true),
      this.countShopsCreatedInRange(ranges.previous, false),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.countCustomersCreatedInRange(ranges.current, true),
      this.countCustomersCreatedInRange(ranges.previous, false),
      this.shopRepository.count({ where: { status: ShopStatus.PENDING } }),
      this.productRepository.count({ where: { status: ProductStatus.PENDING } }),
      this.returnRequestRepository.count({
        where: { status: ReturnStatus.PENDING },
      }),
      this.getRecentActivity(15),
    ]);

    return {
      period,
      totalRevenue: currentRevenue.revenue,
      totalCommission: currentRevenue.commission,
      totalOrders: currentOrders,
      activeShops,
      totalCustomers,
      revenueChange: calculateTrendPercent(
        currentRevenue.revenue,
        previousRevenue.revenue,
      ),
      ordersChange: calculateTrendPercent(currentOrders, previousOrders),
      shopsChange: calculateTrendPercent(newShopsCurrent, newShopsPrevious),
      customersChange: calculateTrendPercent(
        newCustomersCurrent,
        newCustomersPrevious,
      ),
      pendingShops,
      pendingProducts,
      openDisputes,
      recentActivity,
    };
  }

  async getRevenueChart(periodInput?: string) {
    const period = normalizeDashboardPeriod(periodInput);
    const { current } = getPeriodRanges(period);
    const truncUnit = period === 'year' ? 'month' : 'day';

    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select(`DATE_TRUNC('${truncUnit}', order.deliveredAt)`, 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('SUM(order.commissionAmount)', 'commission')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.deliveredAt IS NOT NULL')
      .andWhere('order.deliveredAt >= :start', { start: current.start })
      .andWhere('order.deliveredAt <= :end', { end: current.end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue) || 0,
      commission: Number(row.commission) || 0,
    }));
  }

  private async sumDeliveredRevenue(
    range: { start: Date; end: Date },
    endInclusive: boolean,
  ) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(order.commissionAmount), 0)', 'commission')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.deliveredAt IS NOT NULL')
      .andWhere('order.deliveredAt >= :start', { start: range.start });

    if (endInclusive) {
      qb.andWhere('order.deliveredAt <= :end', { end: range.end });
    } else {
      qb.andWhere('order.deliveredAt < :end', { end: range.end });
    }

    const raw = await qb.getRawOne();

    return {
      revenue: Number(raw?.revenue) || 0,
      commission: Number(raw?.commission) || 0,
    };
  }

  private async countDeliveredOrders(
    range: { start: Date; end: Date },
    endInclusive: boolean,
  ) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.deliveredAt IS NOT NULL')
      .andWhere('order.deliveredAt >= :start', { start: range.start });

    if (endInclusive) {
      qb.andWhere('order.deliveredAt <= :end', { end: range.end });
    } else {
      qb.andWhere('order.deliveredAt < :end', { end: range.end });
    }

    return qb.getCount();
  }

  private countShopsCreatedInRange(
    range: { start: Date; end: Date },
    endInclusive: boolean,
  ) {
    const qb = this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.createdAt >= :start', { start: range.start });

    if (endInclusive) {
      qb.andWhere('shop.createdAt <= :end', { end: range.end });
    } else {
      qb.andWhere('shop.createdAt < :end', { end: range.end });
    }

    return qb.getCount();
  }

  private countCustomersCreatedInRange(
    range: { start: Date; end: Date },
    endInclusive: boolean,
  ) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.createdAt >= :start', { start: range.start });

    if (endInclusive) {
      qb.andWhere('user.createdAt <= :end', { end: range.end });
    } else {
      qb.andWhere('user.createdAt < :end', { end: range.end });
    }

    return qb.getCount();
  }

  private async getRecentActivity(limit: number): Promise<DashboardActivityItem[]> {
    const perSource = Math.ceil(limit / 4);

    const [orders, shops, products, returns] = await Promise.all([
      this.orderRepository.find({
        select: ['id', 'orderNumber', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: perSource,
      }),
      this.shopRepository.find({
        select: ['id', 'name', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: perSource,
      }),
      this.productRepository.find({
        select: ['id', 'name', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: perSource,
      }),
      this.returnRequestRepository.find({
        relations: ['order'],
        order: { createdAt: 'DESC' },
        take: perSource,
      }),
    ]);

    const activities: DashboardActivityItem[] = [
      ...orders.map((order) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        description: `New order #${order.orderNumber} placed`,
        createdAt: order.createdAt.toISOString(),
      })),
      ...shops.map((shop) => ({
        id: `shop-${shop.id}`,
        type: 'shop' as const,
        description: `New shop "${shop.name}" registered`,
        createdAt: shop.createdAt.toISOString(),
      })),
      ...products.map((product) => ({
        id: `product-${product.id}`,
        type: 'product' as const,
        description: `New product "${product.name}" submitted`,
        createdAt: product.createdAt.toISOString(),
      })),
      ...returns.map((ret) => ({
        id: `return-${ret.id}`,
        type: 'order' as const,
        description: `Return request opened for order #${ret.order?.orderNumber ?? ret.orderId.slice(0, 8)}`,
        createdAt: ret.createdAt.toISOString(),
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }
}
