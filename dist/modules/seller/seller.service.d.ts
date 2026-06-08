import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { ShopProfileDto } from './dto/shop-profile.dto';
export declare class SellerService {
    private readonly shopRepository;
    private readonly userRepository;
    private readonly productRepository;
    private readonly orderRepository;
    private readonly logger;
    constructor(shopRepository: Repository<Shop>, userRepository: Repository<User>, productRepository: Repository<Product>, orderRepository: Repository<Order>);
    getShopByOwner(ownerId: string): Promise<Shop>;
    createShop(ownerId: string, shopProfileDto: ShopProfileDto): Promise<Shop & Shop[]>;
    updateShop(ownerId: string, shopProfileDto: ShopProfileDto): Promise<Shop>;
    uploadShopLogo(ownerId: string, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        logoUrl: string;
    }>;
    uploadShopBanner(ownerId: string, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        bannerUrl: string;
    }>;
    getDashboardStats(ownerId: string): Promise<{
        totalProducts: number;
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: any;
        todayOrders: number;
        recentOrders: {
            id: string;
            orderNumber: string;
            status: OrderStatus;
            totalAmount: number;
            customerName: string;
            createdAt: Date;
        }[];
    }>;
    getSalesChart(ownerId: string, period: string): Promise<any[]>;
}
