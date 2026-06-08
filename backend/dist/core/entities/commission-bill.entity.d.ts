import { Shop } from './shop.entity';
export declare enum CommissionBillStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare class CommissionBill {
    id: string;
    shop: Shop;
    shopId: string;
    billDate: string;
    orderCount: number;
    totalOrderValue: number;
    commissionAmount: number;
    commissionPercent: number;
    fineAmount: number;
    daysOverdue: number;
    status: CommissionBillStatus;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    paidAt: Date;
    reminderSentAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
