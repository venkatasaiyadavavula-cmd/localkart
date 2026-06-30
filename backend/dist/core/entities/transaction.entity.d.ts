import { Order } from './order.entity';
export declare enum TransactionType {
    PAYMENT = "payment",
    REFUND = "refund",
    SETTLEMENT = "settlement",
    COMMISSION = "commission"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare class Transaction {
    id: string;
    order: Order;
    orderId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    metadata: Record<string, any>;
    failureReason: string;
    createdAt: Date;
}
