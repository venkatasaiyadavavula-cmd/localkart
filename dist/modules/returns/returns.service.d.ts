import { Repository, DataSource } from 'typeorm';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { Order } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { CreateReturnRequestDto, UpdateReturnStatusDto } from './dto/return-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ReturnsService {
    private readonly returnRepository;
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly productRepository;
    private readonly shopRepository;
    private readonly userRepository;
    private readonly dataSource;
    private readonly notificationsService;
    private readonly logger;
    constructor(returnRepository: Repository<ReturnRequest>, orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, productRepository: Repository<Product>, shopRepository: Repository<Shop>, userRepository: Repository<User>, dataSource: DataSource, notificationsService: NotificationsService);
    createReturnRequest(userId: string, dto: CreateReturnRequestDto, files: Express.Multer.File[]): Promise<ReturnRequest>;
    getUserReturnRequests(userId: string, page: number, limit: number): Promise<{
        data: ReturnRequest[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getReturnRequestById(id: string, userId: string, role: UserRole): Promise<ReturnRequest>;
    cancelReturnRequest(id: string, userId: string): Promise<{
        message: string;
    }>;
    getSellerPendingReturns(ownerId: string): Promise<ReturnRequest[]>;
    approveReturnRequest(id: string, ownerId: string): Promise<ReturnRequest>;
    rejectReturnRequest(id: string, ownerId: string, reason: string): Promise<ReturnRequest>;
    schedulePickup(id: string, ownerId: string, body: {
        pickupDate: string;
        pickupAddress: string;
        contactPhone: string;
    }): Promise<ReturnRequest>;
    confirmPickup(id: string, ownerId: string): Promise<ReturnRequest>;
    getAllReturnRequests(page: number, limit: number, status?: string): Promise<{
        data: ReturnRequest[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    adminUpdateReturnStatus(id: string, dto: UpdateReturnStatusDto): Promise<ReturnRequest>;
    processRefund(id: string): Promise<{
        message: string;
    }>;
    private getShopIdByOwner;
}
