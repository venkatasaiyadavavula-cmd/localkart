import { SellerService } from './seller.service';
import { SubscriptionService } from './subscription.service';
import { EarningsService } from './earnings.service';
import { AdCampaignService } from './ad-campaign.service';
import { ShopProfileDto } from './dto/shop-profile.dto';
import { SubscribeDto } from './dto/subscription-plan.dto';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/ad-campaign.dto';
export declare class SellerController {
    private readonly sellerService;
    private readonly subscriptionService;
    private readonly earningsService;
    private readonly adCampaignService;
    constructor(sellerService: SellerService, subscriptionService: SubscriptionService, earningsService: EarningsService, adCampaignService: AdCampaignService);
    getMyShop(user: any): Promise<import("../../core/entities/shop.entity").Shop>;
    createShop(user: any, shopProfileDto: ShopProfileDto): Promise<import("../../core/entities/shop.entity").Shop & import("../../core/entities/shop.entity").Shop[]>;
    updateShop(user: any, shopProfileDto: ShopProfileDto): Promise<import("../../core/entities/shop.entity").Shop>;
    uploadShopLogo(user: any, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        logoUrl: string;
    }>;
    uploadShopBanner(user: any, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        bannerUrl: string;
    }>;
    getDashboard(user: any): Promise<{
        totalProducts: number;
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: any;
        todayOrders: number;
        recentOrders: {
            id: string;
            orderNumber: string;
            status: import("../../core/entities/order.entity").OrderStatus;
            totalAmount: number;
            customerName: string;
            createdAt: Date;
        }[];
    }>;
    getSalesChart(user: any, period?: string): Promise<any[]>;
    getCurrentSubscription(user: any): Promise<{
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
        productLimit: number;
        price: number;
        status: import("../../core/entities/subscription.entity").SubscriptionStatus;
        productCount: number;
        endDate: null;
    } | {
        productCount: number;
        id: string;
        shop: import("../../core/entities/shop.entity").Shop;
        shopId: string;
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
        status: import("../../core/entities/subscription.entity").SubscriptionStatus;
        productLimit: number;
        price: number;
        startDate: Date;
        endDate: Date;
        razorpaySubscriptionId: string;
        razorpayPaymentId: string;
        paymentDetails: Record<string, any>;
        autoRenew: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAvailablePlans(): Promise<{
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
        productLimit: number;
        price: number;
    }[]>;
    subscribe(user: any, subscribeDto: SubscribeDto): Promise<import("../../core/entities/subscription.entity").Subscription>;
    cancelSubscription(user: any): Promise<{
        message: string;
    }>;
    getSubscriptionHistory(user: any): Promise<import("../../core/entities/subscription.entity").Subscription[]>;
    getEarnings(user: any, period?: string): Promise<{
        totalEarnings: any;
        totalCommission: any;
        totalOrders: number;
        pendingSettlement: any;
        availableForPayout: number;
    }>;
    getEarningsTransactions(user: any, page?: string, limit?: string): Promise<{
        data: import("../../core/entities/transaction.entity").Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPayouts(user: any): Promise<import("../../core/entities/transaction.entity").Transaction[]>;
    getAdCampaigns(user: any): Promise<import("../../core/entities/sponsored-product.entity").SponsoredProduct[]>;
    createAdCampaign(user: any, dto: CreateAdCampaignDto): Promise<import("../../core/entities/sponsored-product.entity").SponsoredProduct>;
    updateAdCampaign(user: any, id: string, dto: UpdateAdCampaignDto): Promise<import("../../core/entities/sponsored-product.entity").SponsoredProduct>;
    pauseAdCampaign(user: any, id: string): Promise<import("../../core/entities/sponsored-product.entity").SponsoredProduct>;
    resumeAdCampaign(user: any, id: string): Promise<import("../../core/entities/sponsored-product.entity").SponsoredProduct>;
    getAdStats(user: any, id: string): Promise<{
        impressions: number;
        clicks: number;
        ctr: number;
        spent: number;
        status: import("../../core/entities/sponsored-product.entity").AdStatus;
        remainingDays: number;
    }>;
}
