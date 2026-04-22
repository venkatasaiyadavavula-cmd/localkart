import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { Shop } from '../../core/entities/shop.entity';
import { Category } from '../../core/entities/category.entity';
import { ProductCategoryType } from '../../core/entities/product.entity';
export declare class CommissionService {
    private readonly orderRepository;
    private readonly transactionRepository;
    private readonly shopRepository;
    private readonly categoryRepository;
    private commissionRates;
    constructor(orderRepository: Repository<Order>, transactionRepository: Repository<Transaction>, shopRepository: Repository<Shop>, categoryRepository: Repository<Category>);
    getCommissionSummary(period?: string): Promise<{
        totalCommission: any;
        totalRevenue: any;
        orderCount: any;
        pendingSettlements: any;
        currentRates: Record<ProductCategoryType, number>;
    }>;
    getCommissionTransactions(page: number, limit: number): Promise<{
        data: Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateCategoryCommission(categoryType: string, rate: number): Promise<{
        message: string;
        rates: Record<ProductCategoryType, number>;
    }>;
    settleShopEarnings(shopId: string): Promise<{
        message: string;
        amount?: undefined;
    } | {
        message: string;
        amount: number;
    }>;
}
