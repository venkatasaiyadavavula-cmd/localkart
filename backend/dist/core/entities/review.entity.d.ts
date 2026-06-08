import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';
export declare class Review {
    id: string;
    productId: string;
    product: Product;
    customerId: string;
    customer: User;
    orderId: string;
    order: Order;
    rating: number;
    comment: string;
    images: string[];
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: Date;
}
