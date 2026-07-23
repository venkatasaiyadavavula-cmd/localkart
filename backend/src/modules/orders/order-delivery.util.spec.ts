import { markOrderDelivered, restoreDeliveredStatus } from './order-delivery.util';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../core/entities/order.entity';

function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: OrderStatus.OUT_FOR_DELIVERY,
    deliveryOtp: '1234',
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-02T12:00:00.000Z'),
    ...overrides,
  } as Order;
}

describe('order-delivery.util', () => {
  it('markOrderDelivered sets status, deliveredAt, payment, and clears OTP', () => {
    const at = new Date('2026-07-22T15:30:00.000Z');
    const order = mockOrder();

    markOrderDelivered(order, at);

    expect(order.status).toBe(OrderStatus.DELIVERED);
    expect(order.deliveredAt).toBe(at);
    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order.deliveryOtp).toBeNull();
  });

  it('restoreDeliveredStatus preserves existing deliveredAt', () => {
    const original = new Date('2026-07-20T08:00:00.000Z');
    const order = mockOrder({
      status: OrderStatus.RETURN_REQUESTED,
      deliveredAt: original,
    });

    restoreDeliveredStatus(order);

    expect(order.status).toBe(OrderStatus.DELIVERED);
    expect(order.deliveredAt).toBe(original);
  });

  it('restoreDeliveredStatus backfills deliveredAt from updatedAt when missing', () => {
    const order = mockOrder({
      status: OrderStatus.RETURN_REQUESTED,
      deliveredAt: null as unknown as Date,
    });

    restoreDeliveredStatus(order);

    expect(order.status).toBe(OrderStatus.DELIVERED);
    expect(order.deliveredAt).toEqual(order.updatedAt);
  });
});
