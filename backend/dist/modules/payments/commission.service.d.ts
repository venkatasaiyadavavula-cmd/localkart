import { Repository, DataSource } from 'typeorm';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { Order } from '../../core/entities/order.entity';
import { Shop } from '../../core/entities/shop.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
export declare class CommissionService {
    private readonly billRepo;
    private readonly orderRepo;
    private readonly shopRepo;
    private readonly dataSource;
    private readonly whatsappService;
    private readonly logger;
    constructor(billRepo: Repository<CommissionBill>, orderRepo: Repository<Order>, shopRepo: Repository<Shop>, dataSource: DataSource, whatsappService: WhatsappService);
    generateDailyBills(): Promise<void>;
    applyDailyFines(): Promise<void>;
    sendReminders(): Promise<void>;
    generateBillForShop(shopId: string, date: string): Promise<CommissionBill | null>;
    createCommissionPaymentOrder(shopId: string, billId: string): Promise<{
        razorpayOrderId: any;
        amount: any;
        currency: any;
        key: string;
        billDetails: {
            billDate: string;
            orderCount: number;
            commissionAmount: number;
            fineAmount: number;
            totalDue: number;
            daysOverdue: number;
        };
    }>;
    verifyCommissionPayment(shopId: string, billId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getShopBills(shopId: string, page?: number, limit?: number): Promise<{
        bills: CommissionBill[];
        total: number;
        totalPending: number;
        page: number;
        limit: number;
    }>;
    getOverdueShops(): Promise<CommissionBill[]>;
}
