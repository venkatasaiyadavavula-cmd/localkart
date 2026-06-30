import { Shop } from './shop.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { SponsoredProduct } from './sponsored-product.entity';
export declare enum ProductStatus {
    DRAFT = "draft",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    OUT_OF_STOCK = "out_of_stock"
}
export declare enum ProductCategoryType {
    GROCERIES = "groceries",
    FASHION = "fashion",
    ELECTRONICS = "electronics",
    HOME_ESSENTIALS = "home_essentials",
    BEAUTY = "beauty",
    ACCESSORIES = "accessories"
}
export declare class Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    mrp: number;
    discountPercentage: number;
    stock: number;
    sku: string;
    brand: string;
    categoryType: ProductCategoryType;
    images: string[];
    videos: string[];
    attributes: Record<string, any>;
    status: ProductStatus;
    rejectionReason: string;
    isSponsored: boolean;
    sponsoredUntil: Date;
    viewCount: number;
    orderCount: number;
    rating: number;
    reviewCount: number;
    shop: Shop;
    shopId: string;
    category: Category;
    categoryId: string;
    orderItems: OrderItem[];
    sponsoredCampaigns: SponsoredProduct[];
    createdAt: Date;
    updatedAt: Date;
}
