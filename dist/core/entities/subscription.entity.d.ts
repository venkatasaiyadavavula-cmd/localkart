import { Shop } from './shop.entity';
export declare enum SubscriptionPlan {
    STARTER = "starter",
    GROWTH = "growth",
    BUSINESS = "business"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled",
    PENDING = "pending"
}
export declare class Subscription {
    id: string;
    shop: Shop;
    shopId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    productLimit: number;
    price: number;
    startDate: Date;
    endDate: Date;
    razorpaySubscriptionId: string;
    razorpayPaymentId: string;
    paymentDetails: Record<string, any>;
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
}
