import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';
import { User } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
export declare class AdminService {
    private readonly shopRepository;
    private readonly productRepository;
    private readonly orderRepository;
    private readonly userRepository;
    private readonly transactionRepository;
    constructor(shopRepository: Repository<Shop>, productRepository: Repository<Product>, orderRepository: Repository<Order>, userRepository: Repository<User>, transactionRepository: Repository<Transaction>);
    getDashboardStats(): Promise<{
        totalShops: number;
        totalProducts: number;
        totalOrders: number;
        totalUsers: number;
        totalRevenue: any;
        totalCommission: any;
        pendingShops: number;
        pendingProducts: number;
        todayOrders: number;
    }>;
    getRevenueChart(period: string): Promise<any[]>;
}
