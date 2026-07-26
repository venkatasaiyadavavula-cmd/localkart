import { BadRequestException } from '@nestjs/common';
import { SubscriptionService, SUBSCRIPTION_PLANS } from './subscription.service';
import { SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import * as crypto from 'crypto';

jest.mock('../../config/razorpay.config', () => ({
  __esModule: true,
  default: {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test_1',
        amount: 19900,
        currency: 'INR',
      }),
    },
  },
}));

import razorpayInstance from '../../config/razorpay.config';

describe('SubscriptionService', () => {
  const subscriptionRepository = {
    findOne: jest.fn(),
    create: jest.fn((row) => ({ id: 'sub-pending-1', ...row })),
    save: jest.fn(async (row) => row),
    update: jest.fn(),
  };
  const shopRepository = {
    findOne: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
      })),
    },
  };

  let service: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    service = new SubscriptionService(
      subscriptionRepository as never,
      shopRepository as never,
    );
    shopRepository.findOne.mockResolvedValue({ id: 'shop-1', ownerId: 'owner-1' });
  });

  it('blocks downgrade to a lower plan', async () => {
    subscriptionRepository.findOne.mockResolvedValue({
      plan: SubscriptionPlan.BUSINESS,
      status: SubscriptionStatus.ACTIVE,
    });

    await expect(
      service.subscribe('owner-1', { plan: SubscriptionPlan.GROWTH }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates pending subscription and Razorpay order for paid upgrade', async () => {
    subscriptionRepository.findOne.mockResolvedValue({
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
    });

    const result = await service.subscribe('owner-1', { plan: SubscriptionPlan.GROWTH });

    expect(result.requiresPayment).toBe(true);
    const payment = result as {
      requiresPayment: true;
      razorpayOrderId: string;
    };
    expect(payment.razorpayOrderId).toBe('order_test_1');
    expect(subscriptionRepository.save).toHaveBeenCalled();
    expect(razorpayInstance.orders.create).toHaveBeenCalled();
    const growth = SUBSCRIPTION_PLANS.find((p) => p.plan === SubscriptionPlan.GROWTH)!;
    expect(growth.productLimit).toBe(150);
  });

  it('activates plan on valid payment verification', async () => {
    const pending = {
      id: 'sub-pending-1',
      shopId: 'shop-1',
      plan: SubscriptionPlan.GROWTH,
      productLimit: 150,
      status: SubscriptionStatus.PENDING,
      razorpayOrderId: 'order_test_1',
    };
    subscriptionRepository.findOne.mockResolvedValue(pending);

    const paymentId = 'pay_test_1';
    const orderId = 'order_test_1';
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = await service.verifySubscriptionPayment('owner-1', pending.id, {
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature,
    });

    expect(result.success).toBe(true);
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      { shopId: 'shop-1', status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );
    expect(subscriptionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
    );
  });

  it('rejects invalid payment signature without activating', async () => {
    subscriptionRepository.findOne.mockResolvedValue({
      id: 'sub-pending-1',
      shopId: 'shop-1',
      status: SubscriptionStatus.PENDING,
      razorpayOrderId: 'order_test_1',
    });

    await expect(
      service.verifySubscriptionPayment('owner-1', 'sub-pending-1', {
        razorpayPaymentId: 'pay_bad',
        razorpayOrderId: 'order_test_1',
        razorpaySignature: 'invalid',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(subscriptionRepository.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
      expect.anything(),
    );
  });
});
