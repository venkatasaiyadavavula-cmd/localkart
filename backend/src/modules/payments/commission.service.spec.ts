import { CommissionService } from './commission.service';
import { CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import { RAZORPAY_ORDER_TTL_MS } from './payments.config';

jest.mock('../../config/razorpay.config', () => ({
  __esModule: true,
  default: {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_new_commission',
        amount: 10000,
        currency: 'INR',
      }),
    },
  },
}));

import razorpayInstance from '../../config/razorpay.config';

describe('CommissionService payment idempotency', () => {
  const shopId = 'shop-1';
  const billId = 'bill-1';

  function buildService(billOverrides: Record<string, unknown> = {}) {
    const bill = {
      id: billId,
      shopId,
      billDate: '2025-07-18',
      weekStartDate: '2025-07-12',
      orderCount: 5,
      commissionAmount: 100,
      fineAmount: 0,
      daysOverdue: 0,
      status: CommissionBillStatus.PENDING,
      razorpayOrderId: null as string | null,
      updatedAt: new Date(),
      shop: { name: 'Test Shop' },
      ...billOverrides,
    };

    const billRepo = {
      findOne: jest.fn(async () => bill),
      update: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    };

    const service = new CommissionService(
      billRepo as any,
      {} as any,
      {} as any,
      {} as any,
      { sendCommissionReminder: jest.fn() } as any,
    );

    return { service, billRepo, bill };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  });

  it('reuses non-expired razorpayOrderId on createCommissionPaymentOrder', async () => {
    const recentUpdate = new Date(Date.now() - 5 * 60 * 1000);
    const { service } = buildService({
      razorpayOrderId: 'order_existing_comm',
      updatedAt: recentUpdate,
    });

    const result = await service.createCommissionPaymentOrder(shopId, billId);

    expect(result.razorpayOrderId).toBe('order_existing_comm');
    expect(razorpayInstance.orders.create).not.toHaveBeenCalled();
  });

  it('creates new Razorpay order when existing razorpayOrderId is expired', async () => {
    const expiredUpdate = new Date(Date.now() - RAZORPAY_ORDER_TTL_MS - 1000);
    const billUuid = '550e8400-e29b-41d4-a716-446655440000';
    const { service, billRepo } = buildService({
      id: billUuid,
      razorpayOrderId: 'order_expired_comm',
      updatedAt: expiredUpdate,
    });

    const result = await service.createCommissionPaymentOrder(shopId, billUuid);

    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        receipt: 'comm_550e8400e29b41d4a716446655440000',
        notes: expect.objectContaining({ billId: billUuid }),
      }),
    );
    expect(result.razorpayOrderId).toBe('order_new_commission');
    expect(billRepo.update).toHaveBeenCalledWith(billUuid, { razorpayOrderId: 'order_new_commission' });
  });

  it('verifyCommissionPayment returns early when bill is already PAID', async () => {
    const { service } = buildService({ status: CommissionBillStatus.PAID });

    const result = await service.verifyCommissionPayment(
      shopId,
      billId,
      'pay_1',
      'order_1',
      'invalid_sig_should_not_matter',
    );

    expect(result).toEqual({ success: true, message: 'Commission payment already confirmed' });
  });
});
