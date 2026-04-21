import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { Shop } from '../../core/entities/shop.entity';
import { SubscribeDto } from './dto/subscription-plan.dto';

export const SUBSCRIPTION_PLANS = [
  { plan: SubscriptionPlan.STARTER, productLimit: 30, price: 0 },
  { plan: SubscriptionPlan.GROWTH, productLimit: 60, price: 199 },
  { plan: SubscriptionPlan.BUSINESS, productLimit: 100, price: 499 },
];

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async getCurrentSubscription(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });

    if (!subscription) {
      // Default to free starter plan
      return {
        plan: SubscriptionPlan.STARTER,
        productLimit: 30,
        price: 0,
        status: SubscriptionStatus.ACTIVE,
        productCount: 0,
        endDate: null,
      };
    }

    const productCount = await this.shopRepository.manager
      .createQueryBuilder()
      .from('products', 'p')
      .where('p.shopId = :shopId', { shopId: shop.id })
      .select('COUNT(*)', 'count')
      .getRawOne();

    return {
      ...subscription,
      productCount: parseInt(productCount?.count || '0'),
    };
  }

  getAvailablePlans() {
    return SUBSCRIPTION_PLANS;
  }

  async subscribe(ownerId: string, subscribeDto: SubscribeDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const planDetails = SUBSCRIPTION_PLANS.find(p => p.plan === subscribeDto.plan);
    if (!planDetails) {
      throw new BadRequestException('Invalid subscription plan');
    }

    // Deactivate current active subscription
    await this.subscriptionRepository.update(
      { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      shopId: shop.id,
      plan: subscribeDto.plan,
      productLimit: planDetails.productLimit,
      price: planDetails.price,
      startDate,
      endDate,
      status: planDetails.price > 0 ? SubscriptionStatus.PENDING : SubscriptionStatus.ACTIVE,
      autoRenew: subscribeDto.autoRenew || false,
    });

    await this.subscriptionRepository.save(subscription);

    if (planDetails.price > 0) {
      // Create Razorpay subscription or payment link
      // For now, assume payment is handled separately
    }

    return subscription;
  }

  async cancelSubscription(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;
    await this.subscriptionRepository.save(subscription);

    return { message: 'Subscription cancelled successfully' };
  }

  async getSubscriptionHistory(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return this.subscriptionRepository.find({
      where: { shopId: shop.id },
      order: { createdAt: 'DESC' },
    });
  }

  async checkProductLimit(shopId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { shopId, status: SubscriptionStatus.ACTIVE },
    });

    const productCount = await this.shopRepository.manager
      .createQueryBuilder()
      .from('products', 'p')
      .where('p.shopId = :shopId', { shopId })
      .andWhere('p.status IN (:...statuses)', { statuses: ['approved', 'pending'] })
      .select('COUNT(*)', 'count')
      .getRawOne();

    const limit = subscription?.productLimit || 30;
    return parseInt(productCount?.count || '0') < limit;
  }
}
