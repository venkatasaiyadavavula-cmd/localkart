import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(user: any): Promise<{
        items: import("./dto/cart-item.dto").CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    addToCart(user: any, addToCartDto: AddToCartDto): Promise<{
        items: import("./dto/cart-item.dto").CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    updateCartItem(user: any, productId: string, updateCartItemDto: UpdateCartItemDto): Promise<{
        items: import("./dto/cart-item.dto").CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    removeCartItem(user: any, productId: string): Promise<{
        items: import("./dto/cart-item.dto").CartItem[];
        totalAmount: number;
        totalItems: number;
    } | {
        message: string;
    }>;
    clearCart(user: any): Promise<{
        message: string;
    }>;
}
