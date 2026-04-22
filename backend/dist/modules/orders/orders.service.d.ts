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
    private readonly logger;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, productRepository: Repository<Product>, shopRepository: Repository<Shop>, userRepository: Repository<User>, transactionRepository: Repository<Transaction>, cartService: CartService, dataSource: DataSource, stateMachine: OrderStateMachine);
    private isShopOpen;
    private getNextOpeningTime;
    createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<{
        isShopOpen: boolean;
        shopClosedMessage: string | null;
        id?: string | undefined;
        orderNumber?: string | undefined;
        customer?: User | undefined;
        customerId?: string | undefined;
        shop?: Shop | undefined;
        shopId?: string | undefined;
        items?: OrderItem[] | undefined;
        subtotal?: number | undefined;
        deliveryCharge?: number | undefined;
        discount?: number | undefined;
        totalAmount?: number | undefined;
        commissionAmount?: number | undefined;
        commissionRate?: number | undefined;
        paymentMethod?: PaymentMethod | undefined;
        paymentStatus?: PaymentStatus | undefined;
        status?: OrderStatus | undefined;
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
        transactions?: Transaction[] | undefined;
        returnRequest?: import("../../core/entities/return-request.entity").ReturnRequest | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
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
    adminUpdateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto): Promise<Order>;
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
