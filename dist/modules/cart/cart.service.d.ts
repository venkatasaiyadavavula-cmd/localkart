import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { AddToCartDto, UpdateCartItemDto, CartItem } from './dto/cart-item.dto';
export declare class CartService {
    private readonly redis;
    private readonly productRepository;
    private readonly shopRepository;
    private readonly CART_PREFIX;
    private readonly CART_TTL;
    constructor(redis: Redis, productRepository: Repository<Product>, shopRepository: Repository<Shop>);
    private getCartKey;
    getCart(userId: string): Promise<{
        items: CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    addToCart(userId: string, addToCartDto: AddToCartDto): Promise<{
        items: CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    updateCartItem(userId: string, productId: string, updateDto: UpdateCartItemDto): Promise<{
        items: CartItem[];
        totalAmount: number;
        totalItems: number;
    }>;
    removeCartItem(userId: string, productId: string): Promise<{
        items: CartItem[];
        totalAmount: number;
        totalItems: number;
    } | {
        message: string;
    }>;
    clearCart(userId: string): Promise<{
        message: string;
    }>;
    validateCartForCheckout(userId: string): Promise<{
        cart: {
            items: CartItem[];
            totalAmount: number;
            totalItems: number;
        };
        products: Product[];
    }>;
}
