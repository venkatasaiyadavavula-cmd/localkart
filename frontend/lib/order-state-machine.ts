import type { OrderStatus } from '@/types/order';

/** Mirrors backend OrderStateMachine transitions. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_otp: ['cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'return_requested'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
  returned: [],
  cancelled: [],
};

/** Admin API blocks setting delivered directly (requires customer OTP). */
export function getAdminSelectableStatuses(current: OrderStatus): OrderStatus[] {
  return (ORDER_STATUS_TRANSITIONS[current] ?? []).filter(
    (status) => status !== 'delivered',
  );
}
