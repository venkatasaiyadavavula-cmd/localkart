import { Order } from './order.entity';
import { User } from './user.entity';
export declare enum ReturnStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    PICKUP_SCHEDULED = "pickup_scheduled",
    PICKED_UP = "picked_up",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
}
export declare enum ReturnReason {
    DEFECTIVE = "defective",
    WRONG_ITEM = "wrong_item",
    DAMAGED = "damaged",
    NOT_AS_DESCRIBED = "not_as_described",
    OTHER = "other"
}
export declare class ReturnRequest {
    id: string;
    order: Order;
    orderId: string;
    customer: User;
    customerId: string;
    shopId: string;
    reason: ReturnReason;
    description: string;
    evidenceImages: string[];
    evidenceVideo: string;
    status: ReturnStatus;
    refundAmount: number;
    rejectionReason: string;
    pickupAddress: string;
    pickupScheduledAt: Date;
    pickupContactPhone: string;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
