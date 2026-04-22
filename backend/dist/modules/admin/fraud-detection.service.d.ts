import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { User } from '../../core/entities/user.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { Redis } from 'ioredis';
export declare class FraudDetectionService {
    private readonly orderRepository;
    private readonly userRepository;
    private readonly returnRepository;
    private readonly redis;
    private readonly logger;
    private readonly SUSPICIOUS_THRESHOLDS;
    constructor(orderRepository: Repository<Order>, userRepository: Repository<User>, returnRepository: Repository<ReturnRequest>, redis: Redis);
    getSuspiciousOrders(): Promise<Order[]>;
    getUserActivity(userId: string): Promise<{
        userId: string;
        totalOrders: number;
        codOrders: number;
        cancelledOrders: number;
        returnRequests: number;
        ordersLast24h: number;
        riskScore: number;
        riskLevel: string;
    } | null>;
    blacklistUser(userId: string, reason: string): Promise<{
        message: string;
    }>;
    assessCodRisk(orderId: string): Promise<{
        risk: string;
        reason: string;
        orderId?: undefined;
        riskScore?: undefined;
        riskLevel?: undefined;
        reasons?: undefined;
        recommendedAction?: undefined;
    } | {
        orderId: string;
        riskScore: number;
        riskLevel: string;
        reasons: string[];
        recommendedAction: string;
        risk?: undefined;
        reason?: undefined;
    }>;
    private calculateRiskScore;
}
