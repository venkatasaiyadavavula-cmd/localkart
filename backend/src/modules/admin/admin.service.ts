import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { User } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';

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
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getDashboardStats() {
    const totalShops = await this.shopRepository.count();
    const totalProducts = await this.productRepository.count();
    const totalOrders = await this.orderRepository.count();
    const totalUsers = await this.userRepository.count();

    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const totalCommission = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.commissionAmount)', 'commission')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const pendingShops = await this.shopRepository.count({
      where: { status: 'pending' as any },
    });

    const pendingProducts = await this.productRepository.count({
      where: { status: 'pending' as any },
    });

    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('DATE(order.createdAt) = CURRENT_DATE')
      .getCount();

    return {
      totalShops,
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue?.total || 0,
      totalCommission: totalCommission?.commission || 0,
      pendingShops,
      pendingProducts,
      todayOrders,
    };
  }

  async getRevenueChart(period: string) {
    let interval: string;
    switch (period) {
      case 'week':
        interval = '7 days';
        break;
      case 'month':
        interval = '30 days';
        break;
      case 'year':
        interval = '12 months';
        break;
      default:
        interval = '30 days';
    }

    const revenue = await this.orderRepository
      .createQueryBuilder('order')
      .select(`DATE_TRUNC('day', order.createdAt)`, 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('SUM(order.commissionAmount)', 'commission')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere(`order.createdAt >= NOW() - INTERVAL '${interval}'`)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return revenue;
  }
}
