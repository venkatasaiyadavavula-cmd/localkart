import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { Shop } from '../../core/entities/shop.entity';
import { SubscribeDto } from './dto/subscription-plan.dto';
import { VerifySubscriptionPaymentDto } from './dto/verify-subscription-payment.dto';
import razorpayInstance from '../../config/razorpay.config';
import { razorpayReceipt } from '../payments/razorpay-receipt.util';
export const SUBSCRIPTION_PLANS = [
  { plan: SubscriptionPlan.STARTER, productLimit: 40, price: 0 },
  { plan: SubscriptionPlan.GROWTH, productLimit: 150, price: 199 },
  { plan: SubscriptionPlan.BUSINESS, productLimit: 500, price: 499 },
];

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]: 0,
  [SubscriptionPlan.GROWTH]: 1,
  [SubscriptionPlan.BUSINESS]: 2,
};

/**
 * Billing model: manual monthly payment via Razorpay Orders (same as commission bills).
 * Seller pays each month to renew/upgrade; auto-recurring via Razorpay Subscriptions API is a fast-follow.
 */
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
      return {
        plan: SubscriptionPlan.STARTER,
        productLimit: 40,
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

    const planDetails = SUBSCRIPTION_PLANS.find((p) => p.plan === subscribeDto.plan);
    if (!planDetails) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const active = await this.subscriptionRepository.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });
    const currentPlan = active?.plan ?? SubscriptionPlan.STARTER;

    if (PLAN_RANK[subscribeDto.plan] < PLAN_RANK[currentPlan]) {
      throw new BadRequestException(
        'Downgrades take effect at the end of your current billing period. ' +
          'Cancel your plan or wait until it expires, then choose a lower plan.',
      );
    }

    if (subscribeDto.plan === currentPlan && active) {
      throw new BadRequestException('You are already on this plan');
    }

    if (planDetails.price === 0) {
      return this.activateFreePlan(shop.id, subscribeDto.plan, planDetails);
    }

    await this.subscriptionRepository.update(
      { shopId: shop.id, status: SubscriptionStatus.PENDING },
      { status: SubscriptionStatus.CANCELLED },
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const pending = this.subscriptionRepository.create({
      shopId: shop.id,
      plan: subscribeDto.plan,
      productLimit: planDetails.productLimit,
      price: planDetails.price,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING,
      autoRenew: false,
    });
    await this.subscriptionRepository.save(pending);

    const amountPaise = Math.round(planDetails.price * 100);
    const rzpOrder = await razorpayInstance.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: razorpayReceipt('sub_', pending.id),
      payment_capture: true,
      notes: {
        type: 'subscription',
        subscriptionId: pending.id,
        shopId: shop.id,
        plan: subscribeDto.plan,
      },
    });

    pending.razorpayOrderId = (rzpOrder as { id: string }).id;
    await this.subscriptionRepository.save(pending);

    return {
      requiresPayment: true,
      subscriptionId: pending.id,
      razorpayOrderId: pending.razorpayOrderId,
      amount: (rzpOrder as { amount: number }).amount,
      currency: (rzpOrder as { currency: string }).currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan: subscribeDto.plan,
      price: planDetails.price,
    };
  }

  async verifySubscriptionPayment(ownerId: string, subscriptionId: string, dto: VerifySubscriptionPaymentDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const pending = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, shopId: shop.id },
    });
    if (!pending) {
      throw new NotFoundException('Subscription not found');
    }
    if (pending.status === SubscriptionStatus.ACTIVE) {
      return { success: true, subscription: pending };
    }
    if (pending.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Subscription is not awaiting payment');
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    if (pending.razorpayOrderId && pending.razorpayOrderId !== dto.razorpayOrderId) {
      throw new BadRequestException('Order ID does not match subscription');
    }

    await this.subscriptionRepository.update(
      { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    pending.status = SubscriptionStatus.ACTIVE;
    pending.razorpayPaymentId = dto.razorpayPaymentId;
    pending.razorpayOrderId = dto.razorpayOrderId;
    await this.subscriptionRepository.save(pending);

    return { success: true, subscription: pending };
  }

  private async activateFreePlan(
    shopId: string,
    plan: SubscriptionPlan,
    planDetails: (typeof SUBSCRIPTION_PLANS)[number],
  ) {
    await this.subscriptionRepository.update(
      { shopId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      shopId,
      plan,
      productLimit: planDetails.productLimit,
      price: planDetails.price,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      autoRenew: false,
    });
    await this.subscriptionRepository.save(subscription);

    return { requiresPayment: false, subscription };
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

    const plan = subscription?.plan ?? SubscriptionPlan.STARTER;
    const limit = SUBSCRIPTION_PLANS.find((p) => p.plan === plan)?.productLimit ?? 40;
    return parseInt(productCount?.count || '0') < limit;
  }
}
