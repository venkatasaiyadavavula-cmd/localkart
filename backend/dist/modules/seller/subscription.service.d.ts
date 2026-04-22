import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { Shop } from '../../core/entities/shop.entity';
import { SubscribeDto } from './dto/subscription-plan.dto';
export declare const SUBSCRIPTION_PLANS: {
    plan: SubscriptionPlan;
    productLimit: number;
    price: number;
}[];
export declare class SubscriptionService {
    private readonly subscriptionRepository;
    private readonly shopRepository;
    constructor(subscriptionRepository: Repository<Subscription>, shopRepository: Repository<Shop>);
    getCurrentSubscription(ownerId: string): Promise<{
        plan: SubscriptionPlan;
        productLimit: number;
        price: number;
        status: SubscriptionStatus;
        productCount: number;
        endDate: null;
    } | {
        productCount: number;
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
    }>;
    getAvailablePlans(): {
        plan: SubscriptionPlan;
        productLimit: number;
        price: number;
    }[];
    subscribe(ownerId: string, subscribeDto: SubscribeDto): Promise<Subscription>;
    cancelSubscription(ownerId: string): Promise<{
        message: string;
    }>;
    getSubscriptionHistory(ownerId: string): Promise<Subscription[]>;
    checkProductLimit(shopId: string): Promise<boolean>;
}
