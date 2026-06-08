import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ModerationService {
    private readonly shopRepository;
    private readonly productRepository;
    private readonly notificationsService;
    constructor(shopRepository: Repository<Shop>, productRepository: Repository<Product>, notificationsService: NotificationsService);
    getPendingShops(page: number, limit: number): Promise<{
        data: Shop[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAllShops(page: number, limit: number, status?: string): Promise<{
        data: Shop[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approveShop(id: string): Promise<Shop>;
    rejectShop(id: string, reason: string): Promise<Shop>;
    suspendShop(id: string, reason: string): Promise<Shop>;
    getPendingProducts(page: number, limit: number): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approveProduct(id: string): Promise<Product>;
    rejectProduct(id: string, reason: string): Promise<Product>;
}
