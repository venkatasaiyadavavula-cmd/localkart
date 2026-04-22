import { Product } from './product.entity';
import { Shop } from './shop.entity';
export declare enum AdStatus {
    PENDING = "pending",
    ACTIVE = "active",
    PAUSED = "paused",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare enum AdType {
    SPONSORED = "sponsored",
    VIDEO = "video"
}
export declare class SponsoredProduct {
    id: string;
    product: Product;
    productId: string;
    shop: Shop;
    shopId: string;
    adType: AdType;
    status: AdStatus;
    costPerDay: number;
    startDate: Date;
    endDate: Date;
    totalCost: number;
    impressions: number;
    clicks: number;
    razorpayPaymentId: string;
    targeting: {
        pincodes?: string[];
        categories?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
