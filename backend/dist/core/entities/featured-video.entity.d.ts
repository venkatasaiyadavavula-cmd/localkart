import { Shop } from './shop.entity';
import { Product } from './product.entity';
export declare enum FeaturedVideoStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    PENDING = "pending"
}
export declare class FeaturedVideo {
    id: string;
    shopId: string;
    shop: Shop;
    productId: string;
    product: Product;
    videoUrl: string;
    amount: number;
    status: FeaturedVideoStatus;
    expiresAt: Date;
    createdAt: Date;
}
