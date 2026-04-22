import { OrderStatus } from '../../../core/entities/order.entity';
export declare class OrderStateMachine {
    private readonly transitions;
    canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean;
    getNextAllowedStatuses(currentStatus: OrderStatus): OrderStatus[];
}
