import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(user: any, createOrderDto: CreateOrderDto): Promise<{
        isShopOpen: boolean;
        shopClosedMessage: string;
        id: string;
        orderNumber: string;
        customerId: string;
        customer: import("../../core/entities/user.entity").User;
        shopId: string;
        shop: import("../../core/entities/shop.entity").Shop;
        items: import("../../core/entities/order-item.entity").OrderItem[];
        totalAmount: number;
        deliveryCharge: number;
        discount: number;
        finalAmount: number;
        commissionAmount: number;
        commissionPercent: number;
        paymentMethod: import("../../core/entities/order.entity").PaymentMethod;
        paymentStatus: import("../../core/entities/order.entity").PaymentStatus;
        status: import("../../core/entities/order.entity").OrderStatus;
        deliveryAddress: Record<string, any>;
        deliveryOtp: string;
        deliveryNotes: string;
        cancellationReason: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        deliveryLatitude: number | null;
        deliveryLongitude: number | null;
        locationUpdatedAt: Date | null;
        deliveryStaffName: string | null;
        deliveryStaffPhone: string | null;
        createdAt: Date;
        updatedAt: Date;
        confirmedAt: Date;
        deliveredAt: Date;
        cancelledAt: Date;
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
    adminUpdateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<any>;
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
