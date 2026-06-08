import { Order } from './order.entity';
import { Product } from './product.entity';
export declare class OrderItem {
    id: string;
    order: Order;
    orderId: string;
    product: Product;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    commissionRate: number;
    commissionAmount: number;
    createdAt: Date;
}
