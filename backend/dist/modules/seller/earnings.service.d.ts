import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { Shop } from '../../core/entities/shop.entity';
export declare class EarningsService {
    private readonly orderRepository;
    private readonly transactionRepository;
    private readonly shopRepository;
    constructor(orderRepository: Repository<Order>, transactionRepository: Repository<Transaction>, shopRepository: Repository<Shop>);
    getEarningsSummary(ownerId: string, period?: string): Promise<{
        totalEarnings: any;
        totalCommission: any;
        totalOrders: number;
        pendingSettlement: any;
        availableForPayout: number;
    }>;
    getTransactions(ownerId: string, page: number, limit: number): Promise<{
        data: Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPayouts(ownerId: string): Promise<Transaction[]>;
}
