import { WishlistService } from './wishlist.service';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    toggle(user: any, productId: string): Promise<{
        added: boolean;
    }>;
    getWishlist(user: any): Promise<import("../../core/entities/wishlist.entity").Wishlist[]>;
    getWishlistIds(user: any): Promise<string[]>;
}
