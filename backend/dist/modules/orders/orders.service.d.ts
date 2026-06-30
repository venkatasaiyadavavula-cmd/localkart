import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStateMachine } from './workflows/order-state-machine';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly productRepository;
    private readonly shopRepository;
    private readonly userRepository;
    private readonly transactionRepository;
    private readonly cartService;
    private readonly dataSource;
    private readonly stateMachine;
    private readonly notificationsService;
    private readonly logger;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, productRepository: Repository<Product>, shopRepository: Repository<Shop>, userRepository: Repository<User>, transactionRepository: Repository<Transaction>, cartService: CartService, dataSource: DataSource, stateMachine: OrderStateMachine, notificationsService: NotificationsService);
    private isShopOpen;
    private getNextOpeningTime;
    createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<{
        isShopOpen: boolean;
        shopClosedMessage: string;
        id: string;
        orderNumber: string;
        customerId: string;
        customer: User;
        shopId: string;
        shop: Shop;
        items: OrderItem[];
        totalAmount: number;
        deliveryCharge: number;
        discount: number;
        finalAmount: number;
        commissionAmount: number;
        commissionPercent: number;
        paymentMethod: PaymentMethod;
        paymentStatus: PaymentStatus;
        status: OrderStatus;
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
    private calculateCommissionRate;
    private getProductCommissionRate;
    verifyDeliveryOtp(orderId: string, otp: string, currentUser: any): Promise<{
        message: string;
        order: Order;
    }>;
    getUserOrders(userId: string, page: number, limit: number, status?: string): Promise<{
        data: Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getOrderById(id: string, userId: string, role: UserRole): Promise<Order>;
    cancelOrder(orderId: string, userId: string, reason?: string): Promise<{
        message: string;
        order: Order;
    }>;
    getSellerOrders(sellerId: string, page: number, limit: number, status?: string): Promise<{
        data: Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateOrderStatusBySeller(orderId: string, sellerId: string, updateDto: UpdateOrderStatusDto): Promise<Order>;
    adminUpdateOrderStatus(id: string, dto: any): Promise<Order>;
    getAllOrders(page: number, limit: number, status?: string, shopId?: string): Promise<{
        data: Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    trackOrderByNumber(orderNumber: string): Promise<{
        orderNumber: string;
        status: OrderStatus;
        createdAt: Date;
        estimatedDelivery: string;
        shop: {
            name: string;
            phone: string;
        };
    }>;
    confirmPaidOrder(internalOrderId: string, razorpayPaymentId: string): Promise<Order>;
    updateRazorpayOrderId(internalOrderId: string, razorpayOrderId: string): Promise<void>;
}
