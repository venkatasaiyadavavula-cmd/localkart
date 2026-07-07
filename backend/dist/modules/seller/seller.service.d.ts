import { Repository } from 'typeorm';
import { Shop, ManualOverride } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { ShopProfileDto } from './dto/shop-profile.dto';
import { UpdateShopHoursDto } from './dto/shop-hours.dto';
import { ShopToggleDto } from './dto/shop-toggle.dto';
export declare class SellerService {
    private readonly shopRepository;
    private readonly userRepository;
    private readonly productRepository;
    private readonly orderRepository;
    private readonly logger;
    constructor(shopRepository: Repository<Shop>, userRepository: Repository<User>, productRepository: Repository<Product>, orderRepository: Repository<Order>);
    getShopByOwner(ownerId: string): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    getShopBySlug(slug: string): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    getShopById(id: string): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    createShop(ownerId: string, shopProfileDto: ShopProfileDto): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    updateShop(ownerId: string, shopProfileDto: ShopProfileDto): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    updateOperatingHours(ownerId: string, hoursDto: UpdateShopHoursDto): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
    setManualOverride(ownerId: string, toggleDto: ShopToggleDto): Promise<Shop & import("../../core/types/shop-hours.types").ShopHoursStatus>;
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
        shopName: string;
        isCurrentlyOpen: boolean;
        statusMessage: string;
        manualOverride: ManualOverride;
        totalProducts: number;
        activeProducts: number;
        lowStockProducts: number;
        totalOrders: number;
        pendingOrders: number;
        pendingOtpOrders: number;
        confirmedOrders: number;
        productsSold: number;
        totalRevenue: number;
        revenueChange: number;
        ordersChange: number;
        productsSoldChange: number;
        activeProductsChange: number;
        recentOrders: {
            id: string;
            orderNumber: string;
            status: OrderStatus;
            totalAmount: number;
            customer: {
                name: string;
            };
            createdAt: Date;
        }[];
        topProducts: Product[];
    }>;
    getSalesChart(ownerId: string, period: string): Promise<{
        date: any;
        sales: number;
        orders: number;
    }[]>;
}
