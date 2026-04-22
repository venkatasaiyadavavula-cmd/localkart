import { User } from './user.entity';
import { Shop } from './shop.entity';
import { OrderItem } from './order-item.entity';
import { Transaction } from './transaction.entity';
import { ReturnRequest } from './return-request.entity';
export declare enum OrderStatus {
    PENDING_OTP = "pending_otp",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    READY_FOR_PICKUP = "ready_for_pickup",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    RETURN_REQUESTED = "return_requested",
    RETURNED = "returned"
}
export declare enum PaymentMethod {
    COD = "cod",
    RAZORPAY = "razorpay"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare class Order {
    id: string;
    orderNumber: string;
    customer: User;
    customerId: string;
    shop: Shop;
    shopId: string;
    items: OrderItem[];
    subtotal: number;
    deliveryCharge: number;
    discount: number;
    totalAmount: number;
    commissionAmount: number;
    commissionRate: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    shippingAddress: {
        name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        latitude?: number;
        longitude?: number;
    };
    deliveryOtp: string;
    deliveryNotes: string;
    cancellationReason: string;
    confirmedAt: Date;
    deliveredAt: Date;
    cancelledAt: Date;
    transactions: Transaction[];
    returnRequest: ReturnRequest;
    createdAt: Date;
    updatedAt: Date;
}
