import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';
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
    } | {
        isShopOpen: boolean;
        shopClosedMessage: string;
        deliveryAddress: Record<string, any>;
        shippingAddress: Record<string, any>;
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
    getSellerOrders(user: any, page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAllOrders(page?: string, limit?: string, status?: string, shopId?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
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
    updateDeliveryLocation(user: any, id: string, dto: UpdateDeliveryLocationDto): Promise<{
        latitude: number;
        longitude: number;
        updatedAt: string;
        staffName: string;
        message: string;
    }>;
    updateOrderStatus(user: any, id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    adminUpdateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    getOrderById(user: any, id: string): Promise<import("../../core/entities/order.entity").Order | {
        deliveryAddress: Record<string, any>;
        shippingAddress: Record<string, any>;
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
    cancelOrder(user: any, id: string, reason?: string): Promise<{
        message: string;
        order: import("../../core/entities/order.entity").Order;
    }>;
    verifyDeliveryOtp(user: any, id: string, otp: string): Promise<{
        message: string;
        order: import("../../core/entities/order.entity").Order;
    }>;
}
