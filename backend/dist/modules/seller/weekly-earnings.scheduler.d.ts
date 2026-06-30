import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
export declare class WeeklyEarningsScheduler {
    private readonly orderRepo;
    private readonly shopRepo;
    private readonly billRepo;
    private readonly whatsappService;
    private readonly logger;
    constructor(orderRepo: Repository<Order>, shopRepo: Repository<Shop>, billRepo: Repository<CommissionBill>, whatsappService: WhatsappService);
    sendWeeklyEarnings(): Promise<void>;
    getWeeklyEarningsData(shopId: string): Promise<{
        weeks: any[];
        growth: number;
        currentWeek: any;
    }>;
}
