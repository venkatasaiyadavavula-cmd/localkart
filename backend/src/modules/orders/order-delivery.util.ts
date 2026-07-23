import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../core/entities/order.entity';

/** Mark an order delivered via OTP verification (always sets a fresh deliveredAt). */
export function markOrderDelivered(order: Order, deliveredAt: Date = new Date()): void {
  order.status = OrderStatus.DELIVERED;
  order.deliveredAt = deliveredAt;
  order.paymentStatus = PaymentStatus.PAID;
  order.deliveryOtp = null;
}

/**
 * Restore delivered status after a cancelled/rejected return.
 * Preserves an existing deliveredAt; backfills from fallback when missing.
 */
export function restoreDeliveredStatus(
  order: Order,
  fallback: Date = order.updatedAt ?? order.createdAt ?? new Date(),
): void {
  order.status = OrderStatus.DELIVERED;
  if (!order.deliveredAt) {
    order.deliveredAt = fallback;
  }
}
