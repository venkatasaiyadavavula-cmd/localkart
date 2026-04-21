import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../core/entities/order.entity';

@Injectable()
export class OrderStateMachine {
  private readonly transitions: Map<OrderStatus, OrderStatus[]> = new Map([
    [
      OrderStatus.PENDING_OTP,
      [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    ],
    [
      OrderStatus.CONFIRMED,
      [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    ],
    [
      OrderStatus.PROCESSING,
      [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
    ],
    [
      OrderStatus.READY_FOR_PICKUP,
      [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    ],
    [
      OrderStatus.OUT_FOR_DELIVERY,
      [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED],
    ],
    [
      OrderStatus.DELIVERED,
      [OrderStatus.RETURN_REQUESTED],
    ],
    [
      OrderStatus.RETURN_REQUESTED,
      [OrderStatus.RETURNED, OrderStatus.DELIVERED],
    ],
    [
      OrderStatus.RETURNED,
      [],
    ],
    [
      OrderStatus.CANCELLED,
      [],
    ],
  ]);

  canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const allowed = this.transitions.get(currentStatus) || [];
    return allowed.includes(targetStatus);
  }

  getNextAllowedStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return this.transitions.get(currentStatus) || [];
  }
}
