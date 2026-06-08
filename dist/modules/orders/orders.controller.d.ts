import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(user: any, createOrderDto: CreateOrderDto): Promise<{
        isShopOpen: boolean;
        shopClosedMessage: string | null;
        id?: string | undefined;
        orderNumber?: string | undefined;
        customer?: import("../../core/entities/user.entity").User | undefined;
        customerId?: string | undefined;
        shop?: import("../../core/entities/shop.entity").Shop | undefined;
        shopId?: string | undefined;
        items?: import("../../core/entities/order-item.entity").OrderItem[] | undefined;
        subtotal?: number | undefined;
        deliveryCharge?: number | undefined;
        discount?: number | undefined;
        totalAmount?: number | undefined;
        commissionAmount?: number | undefined;
        commissionRate?: number | undefined;
        paymentMethod?: import("../../core/entities/order.entity").PaymentMethod | undefined;
        paymentStatus?: import("../../core/entities/order.entity").PaymentStatus | undefined;
        status?: import("../../core/entities/order.entity").OrderStatus | undefined;
        shippingAddress?: {
            name: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
            latitude?: number;
            longitude?: number;
        } | undefined;
        deliveryOtp?: string | undefined;
        deliveryNotes?: string | undefined;
        cancellationReason?: string | undefined;
        confirmedAt?: Date | undefined;
        deliveredAt?: Date | undefined;
        cancelledAt?: Date | undefined;
        transactions?: import("../../core/entities/transaction.entity").Transaction[] | undefined;
        returnRequest?: import("../../core/entities/return-request.entity").ReturnRequest | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
    }>;
    getMyOrders(user: any, page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getOrderById(user: any, id: string): Promise<import("../../core/entities/order.entity").Order>;
    cancelOrder(user: any, id: string, reason?: string): Promise<{
        message: string;
        order: import("../../core/entities/order.entity").Order;
    }>;
    verifyDeliveryOtp(user: any, id: string, otp: string): Promise<{
        message: string;
        order: import("../../core/entities/order.entity").Order;
    }>;
    getSellerOrders(user: any, page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateOrderStatus(user: any, id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    getAllOrders(page?: string, limit?: string, status?: string, shopId?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    adminUpdateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    trackOrder(orderNumber: string): Promise<{
        orderNumber: string;
        status: import("../../core/entities/order.entity").OrderStatus;
        createdAt: Date;
        estimatedDelivery: string;
        shop: {
            name: string;
            phone: string;
        };
    }>;
}
