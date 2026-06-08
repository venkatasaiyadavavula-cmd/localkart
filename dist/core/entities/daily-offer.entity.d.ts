import { Shop } from './shop.entity';
import { Product } from './product.entity';
export declare class DailyOffer {
    id: string;
    shopId: string;
    shop: Shop;
    productId: string;
    product: Product;
    offerPrice: number;
    originalPrice: number;
    discountPercentage: number;
    startsAt: Date;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
}
