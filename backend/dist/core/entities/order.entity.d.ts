import { User } from './user.entity';
import { Shop } from './shop.entity';
import { OrderItem } from './order-item.entity';
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
    RAZORPAY = "razorpay",
    WALLET = "wallet"
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
    customerId: string;
    customer: User;
    shopId: string;
    shop: Shop;
    items: OrderItem[];
    subtotal: number;
    totalAmount: number;
    deliveryCharge: number;
    discount: number;
    finalAmount: number;
    commissionAmount: number;
    commissionPercent: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    deliveryAddress: Record<string, any>;
    deliveryOtp: string;
    deliveryNotes: string;
    cancellationReason: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    locationUpdatedAt: Date | null;
    deliveryStaffName: string | null;
    deliveryStaffPhone: string | null;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date;
    deliveredAt: Date;
    cancelledAt: Date;
}
