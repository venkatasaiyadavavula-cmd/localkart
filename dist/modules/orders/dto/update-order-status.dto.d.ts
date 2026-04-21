import { OrderStatus } from '../../../core/entities/order.entity';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    notes?: string;
}
