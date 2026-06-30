import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from '../../core/entities/order.entity';
import { User } from '../../core/entities/user.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private readonly SUSPICIOUS_THRESHOLDS = {
    codOrdersPerHour: 5,
    returnsRatio: 0.3, // 30% return rate
    highValueCod: 2000, // ₹2000+
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ReturnRequest)
    private readonly returnRepository: Repository<ReturnRequest>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getSuspiciousOrders() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // High value COD orders
    const highValueCod = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.paymentMethod = :method', { method: PaymentMethod.COD })
      .andWhere('order.totalAmount > :amount', { amount: this.SUSPICIOUS_THRESHOLDS.highValueCod })
      .andWhere('order.createdAt > :date', { date: oneDayAgo })
      .andWhere('order.status NOT IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
      .leftJoinAndSelect('order.customer', 'customer')
      .getMany();

    return highValueCod;
  }

  async getUserActivity(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    const totalOrders = await this.orderRepository.count({ where: { customerId: userId } });
    const codOrders = await this.orderRepository.count({
      where: { customerId: userId, paymentMethod: PaymentMethod.COD },
    });
    const cancelledOrders = await this.orderRepository.count({
      where: { customerId: userId, status: OrderStatus.CANCELLED },
    });
    const returnRequests = await this.returnRepository.count({
      where: { customerId: userId },
    });

    const ordersLast24h = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.customerId = :userId', { userId })
      .andWhere('order.createdAt > NOW() - INTERVAL \'24 hours\'')
      .getCount();

    const riskScore = this.calculateRiskScore({
      totalOrders,
      codOrders,
      cancelledOrders,
      returnRequests,
      ordersLast24h,
    });

    return {
      userId,
      totalOrders,
      codOrders,
      cancelledOrders,
      returnRequests,
      ordersLast24h,
      riskScore,
      riskLevel: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
    };
  }

  async blacklistUser(userId: string, reason: string) {
    await this.userRepository.update({ id: userId }, { isActive: false });
    await this.redis.set(`blacklist:user:${userId}`, reason, 'EX', 30 * 24 * 60 * 60);
    this.logger.log(`User ${userId} blacklisted. Reason: ${reason}`);
    return { message: 'User blacklisted' };
  }

  async assessCodRisk(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer'],
    });

    if (!order || order.paymentMethod !== PaymentMethod.COD) {
      return { risk: 'N/A', reason: 'Not a COD order' };
    }

    // Check IP rate limiting from Redis
    const ipKey = `rate:order:${order.customerId}`;
    const recentOrders = await this.redis.get(ipKey);
    const orderCount = parseInt(recentOrders || '0');

    const userActivity = await this.getUserActivity(order.customerId);
    let riskScore = 0;
    const reasons: string[] = [];

    if (orderCount > this.SUSPICIOUS_THRESHOLDS.codOrdersPerHour) {
      riskScore += 30;
      reasons.push('High order frequency');
    }

    if (order.totalAmount > this.SUSPICIOUS_THRESHOLDS.highValueCod) {
      riskScore += 25;
      reasons.push('High value COD order');
    }

    if (userActivity.riskScore > 50) {
      riskScore += userActivity.riskScore / 2;
      reasons.push('User has high risk profile');
    }

    return {
      orderId,
      riskScore,
      riskLevel: riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW',
      reasons,
      recommendedAction: riskScore > 60 ? 'Require OTP verification before confirming' : 'Proceed with caution',
    };
  }

  private calculateRiskScore(data: any): number {
    let score = 0;
    if (data.ordersLast24h > 10) score += 30;
    if (data.cancelledOrders / data.totalOrders > 0.5) score += 25;
    if (data.returnRequests / data.totalOrders > this.SUSPICIOUS_THRESHOLDS.returnsRatio) score += 20;
    return Math.min(score, 100);
  }
}
