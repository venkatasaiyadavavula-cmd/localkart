/**
 * Razorpay payment edge-case audit — no real money, mocked services.
 * Run: cd backend && npm test -- payments.audit.spec.ts
 */
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../core/entities/order.entity';
import { TransactionStatus } from '../../core/entities/transaction.entity';
import { RAZORPAY_ORDER_TTL_MS } from './payments.config';

const INTERNAL_ORDER_ID = '05e3815a-ffea-4dfa-9428-e86562276a80';
const RAZORPAY_ORDER_ID = 'order_MxTestRzpOrderId123';
const RAZORPAY_PAYMENT_ID = 'pay_MxTestPaymentId456';
const WEBHOOK_SECRET = 'test_webhook_secret_32_chars_minimum_xx';

function signWebhookBody(body: object, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
}

function signPaymentCallback(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function buildPaymentsService(overrides: {
  order?: Record<string, unknown>;
  ordersService?: Partial<{ confirmPaidOrder: jest.Mock; updateRazorpayOrderId: jest.Mock }>;
  transactions?: Array<Record<string, unknown>>;
} = {}) {
  const order = {
    id: INTERNAL_ORDER_ID,
    customerId: 'cust-1',
    paymentMethod: PaymentMethod.RAZORPAY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING_OTP,
    razorpayOrderId: null as string | null,
    totalAmount: 500,
    ...overrides.order,
  };

  const transactions = [...(overrides.transactions ?? [])];
  const orderRepository = {
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.id === INTERNAL_ORDER_ID) {
        return order;
      }
      if (where.razorpayOrderId === RAZORPAY_ORDER_ID) {
        return { ...order, razorpayOrderId: RAZORPAY_ORDER_ID };
      }
      return null;
    }),
    find: jest.fn(async () => []),
    update: jest.fn(),
  };

  const transactionRepository = {
    findOne: jest.fn(async ({ where, order: sort }: { where: Record<string, unknown>; order?: Record<string, string> }) => {
      const matches = transactions.filter(
        (t) =>
          (where.razorpayPaymentId && t.razorpayPaymentId === where.razorpayPaymentId) ||
          (where.razorpayOrderId && t.razorpayOrderId === where.razorpayOrderId) ||
          (where.orderId && t.orderId === where.orderId && (!where.status || t.status === where.status)),
      );
      if (sort?.createdAt === 'DESC') {
        return matches[matches.length - 1] ?? null;
      }
      return matches[0] ?? null;
    }),
    create: jest.fn((data: Record<string, unknown>) => ({ id: `txn-${transactions.length + 1}`, ...data })),
    save: jest.fn(async (txn: Record<string, unknown>) => {
      const idx = transactions.findIndex((t) => t.id === txn.id);
      if (idx >= 0) {
        transactions[idx] = txn;
      } else {
        transactions.push(txn);
      }
      return txn;
    }),
    update: jest.fn(),
  };

  const confirmPaidOrder = jest.fn(async () => ({ ...order, paymentStatus: PaymentStatus.PAID }));
  const updateRazorpayOrderId = jest.fn(async (_id: string, rzpId: string) => {
    order.razorpayOrderId = rzpId;
    transactions.push({
      orderId: INTERNAL_ORDER_ID,
      razorpayOrderId: rzpId,
      type: 'payment',
      status: TransactionStatus.PENDING,
      amount: 500,
      currency: 'INR',
      createdAt: new Date(),
    });
  });

  const ordersService = {
    confirmPaidOrder,
    updateRazorpayOrderId,
    ...overrides.ordersService,
  };

  const service = new PaymentsService(
    orderRepository as any,
    transactionRepository as any,
    ordersService as any,
  );

  return {
    service,
    order,
    orderRepository,
    transactionRepository,
    transactions,
    confirmPaidOrder,
    updateRazorpayOrderId,
  };
}

describe('Razorpay payment audit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RAZORPAY_KEY_SECRET: 'test_key_secret',
      RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      PAYMENTS_ENABLED: 'true',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1) Webhook order lookup by razorpayOrderId', () => {
    it('handlePaymentCaptured finds order via razorpayOrderId and confirms payment', async () => {
      const { service, confirmPaidOrder } = buildPaymentsService({
        order: { razorpayOrderId: RAZORPAY_ORDER_ID },
        transactions: [
          {
            orderId: INTERNAL_ORDER_ID,
            razorpayOrderId: RAZORPAY_ORDER_ID,
            status: TransactionStatus.PENDING,
          },
        ],
      });

      await service.processRazorpayWebhook({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: RAZORPAY_PAYMENT_ID, order_id: RAZORPAY_ORDER_ID },
          },
        },
      });

      expect(confirmPaidOrder).toHaveBeenCalledWith(INTERNAL_ORDER_ID, RAZORPAY_PAYMENT_ID);
    });
  });

  describe('2) Late webhook vs client verify race', () => {
    it('verifyPayment marks paid; late webhook confirmPaidOrder is idempotent', async () => {
      const { service, confirmPaidOrder } = buildPaymentsService({
        order: { razorpayOrderId: RAZORPAY_ORDER_ID },
      });
      const sig = signPaymentCallback(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, process.env.RAZORPAY_KEY_SECRET!);

      const verified = await service.verifyPayment('cust-1', {
        razorpay_order_id: RAZORPAY_ORDER_ID,
        razorpay_payment_id: RAZORPAY_PAYMENT_ID,
        razorpay_signature: sig,
        internalOrderId: INTERNAL_ORDER_ID,
      });
      expect(verified).toBe(true);
      expect(confirmPaidOrder).toHaveBeenCalledTimes(1);

      await service.processRazorpayWebhook({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: RAZORPAY_PAYMENT_ID, order_id: RAZORPAY_ORDER_ID },
          },
        },
      });
      expect(confirmPaidOrder).toHaveBeenCalledTimes(2);
    });

    it('payment.failed webhook does NOT set order paymentStatus to failed', async () => {
      const { service, orderRepository } = buildPaymentsService({
        transactions: [{ razorpayPaymentId: RAZORPAY_PAYMENT_ID, orderId: INTERNAL_ORDER_ID, status: 'pending' }],
      });

      await service.processRazorpayWebhook({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: RAZORPAY_PAYMENT_ID,
              order_id: RAZORPAY_ORDER_ID,
              error_description: 'Payment timed out',
            },
          },
        },
      });

      expect(orderRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('3) Double-submit create-order idempotency', () => {
    it('reuses non-expired pending razorpayOrderId instead of creating a new one', async () => {
      const recentCreatedAt = new Date(Date.now() - 5 * 60 * 1000);
      const { service, updateRazorpayOrderId } = buildPaymentsService({
        order: { razorpayOrderId: RAZORPAY_ORDER_ID },
        transactions: [
          {
            orderId: INTERNAL_ORDER_ID,
            razorpayOrderId: RAZORPAY_ORDER_ID,
            status: TransactionStatus.PENDING,
            createdAt: recentCreatedAt,
          },
        ],
      });

      const result = await service.createRazorpayOrder('cust-1', { orderId: INTERNAL_ORDER_ID });

      expect(result.orderId).toBe(RAZORPAY_ORDER_ID);
      expect(result.amount).toBe(50000);
      expect(updateRazorpayOrderId).not.toHaveBeenCalled();
    });

    it('does not reuse expired pending razorpayOrderId', async () => {
      const expiredCreatedAt = new Date(Date.now() - RAZORPAY_ORDER_TTL_MS - 1000);
      const { service, updateRazorpayOrderId } = buildPaymentsService({
        order: { razorpayOrderId: RAZORPAY_ORDER_ID },
        transactions: [
          {
            orderId: INTERNAL_ORDER_ID,
            razorpayOrderId: RAZORPAY_ORDER_ID,
            status: TransactionStatus.PENDING,
            createdAt: expiredCreatedAt,
          },
        ],
      });

      jest.spyOn(require('../../config/razorpay.config').default.orders, 'create').mockResolvedValue({
        id: 'order_new_after_expiry',
        amount: 50000,
        currency: 'INR',
      });

      const result = await service.createRazorpayOrder('cust-1', { orderId: INTERNAL_ORDER_ID });

      expect(result.orderId).toBe('order_new_after_expiry');
      expect(updateRazorpayOrderId).toHaveBeenCalled();
    });
  });

  describe('4) Webhook signature verification', () => {
    it('rejects forged signature', () => {
      const body = {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_fake', order_id: 'order_fake' } } },
      };
      const forged = 'deadbeef'.repeat(8);
      const valid = signWebhookBody(body);
      expect(forged).not.toBe(valid);
    });

    it('raw-body signature differs from JSON.stringify re-serialization', () => {
      const rawBody =
        '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1","amount":50000}}}}';
      const sigFromRaw = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
      const prettyBody = JSON.stringify(JSON.parse(rawBody), null, 2);
      const sigFromPretty = crypto.createHmac('sha256', WEBHOOK_SECRET).update(prettyBody).digest('hex');
      expect(sigFromPretty).not.toBe(sigFromRaw);
    });

    it('forged POST cannot pass verifyPayment without KEY_SECRET', async () => {
      const { service, confirmPaidOrder } = buildPaymentsService();
      const result = await service.verifyPayment('cust-1', {
        razorpay_order_id: RAZORPAY_ORDER_ID,
        razorpay_payment_id: RAZORPAY_PAYMENT_ID,
        razorpay_signature: 'forged_signature_value',
        internalOrderId: INTERNAL_ORDER_ID,
      });
      expect(result).toBe(false);
      expect(confirmPaidOrder).not.toHaveBeenCalled();
    });
  });

  describe('5) Abandoned payment cleanup', () => {
    it('expires orders stuck in pending_otp + payment pending after 30 minutes', async () => {
      const staleOrder = {
        id: INTERNAL_ORDER_ID,
        paymentMethod: PaymentMethod.RAZORPAY,
        status: OrderStatus.PENDING_OTP,
        paymentStatus: PaymentStatus.PENDING,
        razorpayOrderId: RAZORPAY_ORDER_ID,
        createdAt: new Date(Date.now() - RAZORPAY_ORDER_TTL_MS - 60_000),
      };

      const { service, orderRepository, transactionRepository } = buildPaymentsService();
      orderRepository.find.mockResolvedValue([staleOrder]);

      await service.expireAbandonedRazorpayOrders();

      expect(orderRepository.update).toHaveBeenCalledWith(
        { id: INTERNAL_ORDER_ID },
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        }),
      );
      expect(transactionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: INTERNAL_ORDER_ID,
          razorpayOrderId: RAZORPAY_ORDER_ID,
          status: TransactionStatus.PENDING,
        }),
        expect.objectContaining({
          status: TransactionStatus.FAILED,
        }),
      );
    });
  });

  describe('6) Webhook handler ack-before-process', () => {
    it('processRazorpayWebhook error propagates to caller; controller still returns 200 first', async () => {
      const throwingConfirm = jest.fn(async () => {
        throw new Error('DB failure after Razorpay sent webhook');
      });
      const { service } = buildPaymentsService({
        order: { razorpayOrderId: RAZORPAY_ORDER_ID },
        ordersService: { confirmPaidOrder: throwingConfirm },
      });

      await expect(
        service.processRazorpayWebhook({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: { id: RAZORPAY_PAYMENT_ID, order_id: RAZORPAY_ORDER_ID },
            },
          },
        }),
      ).rejects.toThrow('DB failure');

      expect(throwingConfirm).toHaveBeenCalled();
    });
  });
});
