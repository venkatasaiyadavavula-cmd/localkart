import { AdminService } from './admin.service';
import { ModerationService } from './moderation.service';
import { CommissionService } from './commission.service';
import { FraudDetectionService } from './fraud-detection.service';
export declare class AdminController {
    private readonly adminService;
    private readonly moderationService;
    private readonly commissionService;
    private readonly fraudDetectionService;
    constructor(adminService: AdminService, moderationService: ModerationService, commissionService: CommissionService, fraudDetectionService: FraudDetectionService);
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
    getRevenueChart(period?: string): Promise<any[]>;
    getPendingShops(page?: string, limit?: string): Promise<{
        data: import("../../core/entities/shop.entity").Shop[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAllShops(page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/shop.entity").Shop[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approveShop(id: string): Promise<import("../../core/entities/shop.entity").Shop>;
    rejectShop(id: string, reason: string): Promise<import("../../core/entities/shop.entity").Shop>;
    suspendShop(id: string, reason: string): Promise<import("../../core/entities/shop.entity").Shop>;
    getPendingProducts(page?: string, limit?: string): Promise<{
        data: import("../../core/entities/product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approveProduct(id: string): Promise<import("../../core/entities/product.entity").Product>;
    rejectProduct(id: string, reason: string): Promise<import("../../core/entities/product.entity").Product>;
    getCommissionSummary(period?: string): Promise<{
        totalCommission: any;
        totalRevenue: any;
        orderCount: any;
        pendingSettlements: any;
        currentRates: Record<import("../../core/entities/product.entity").ProductCategoryType, number>;
    }>;
    getCommissionTransactions(page?: string, limit?: string): Promise<{
        data: import("../../core/entities/transaction.entity").Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateCategoryCommission(categoryType: string, rate: number): Promise<{
        message: string;
        rates: Record<import("../../core/entities/product.entity").ProductCategoryType, number>;
    }>;
    settleShopEarnings(shopId: string): Promise<{
        message: string;
        amount?: undefined;
    } | {
        message: string;
        amount: number;
    }>;
    getSuspiciousOrders(): Promise<import("../../core/entities/order.entity").Order[]>;
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
}
