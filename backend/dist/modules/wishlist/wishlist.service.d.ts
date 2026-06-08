import { Repository } from 'typeorm';
import { Wishlist } from '../../core/entities/wishlist.entity';
export declare class WishlistService {
    private readonly wishlistRepo;
    constructor(wishlistRepo: Repository<Wishlist>);
    toggle(userId: string, productId: string): Promise<{
        added: boolean;
    }>;
    getWishlist(userId: string): Promise<Wishlist[]>;
    isWishlisted(userId: string, productId: string): Promise<boolean>;
    getWishlistProductIds(userId: string): Promise<string[]>;
}
