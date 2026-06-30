import { User } from './user.entity';
import { Product } from './product.entity';
export declare class Wishlist {
    id: string;
    userId: string;
    user: User;
    productId: string;
    product: Product;
    savedAt: Date;
}
