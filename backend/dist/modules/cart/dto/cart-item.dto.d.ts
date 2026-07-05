export declare class AddToCartDto {
    productId: string;
    quantity?: number;
}
export declare class UpdateCartItemDto {
    quantity: number;
}
export interface CartItem {
    productId: string;
    shopId: string;
    shopName?: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    maxQuantity: number;
    slug?: string;
    categoryType?: string;
}
