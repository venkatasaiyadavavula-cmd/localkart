"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../core/entities/order.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
let EarningsService = class EarningsService {
    orderRepository;
    transactionRepository;
    shopRepository;
    constructor(orderRepository, transactionRepository, shopRepository) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.shopRepository = shopRepository;
    }
    async getEarningsSummary(ownerId, period) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .where('order.shopId = :shopId', { shopId: shop.id })
            .andWhere('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED });
        if (period) {
            const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : '365 days';
            queryBuilder.andWhere(`order.deliveredAt >= NOW() - INTERVAL '${interval}'`);
        }
        const totalEarnings = await queryBuilder
            .select('SUM(order.totalAmount - order.commissionAmount - order.deliveryCharge)', 'earnings')
            .getRawOne();
        const totalCommission = await queryBuilder
            .clone()
            .select('SUM(order.commissionAmount)', 'commission')
            .getRawOne();
        const orderCount = await queryBuilder.clone().getCount();
        const pendingSettlement = await this.orderRepository
            .createQueryBuilder('order')
            .leftJoin('order.transactions', 'transaction', 'transaction.type = :type', { type: transaction_entity_1.TransactionType.SETTLEMENT })
            .where('order.shopId = :shopId', { shopId: shop.id })
            .andWhere('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere('transaction.id IS NULL')
            .select('SUM(order.totalAmount - order.commissionAmount)', 'pending')
            .getRawOne();
        return {
            totalEarnings: totalEarnings?.earnings || 0,
            totalCommission: totalCommission?.commission || 0,
            totalOrders: orderCount,
            pendingSettlement: pendingSettlement?.pending || 0,
            availableForPayout: shop.totalEarnings || 0,
        };
    }
    async getTransactions(ownerId, page, limit) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const skip = (page - 1) * limit;
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { order: { shopId: shop.id } },
            relations: ['order'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: transactions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getWeeklyEarnings(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const weeks = [];
        const now = new Date();
        for (let i = 7; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - i * 7);
            weekEnd.setHours(23, 59, 59, 999);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() - 6);
            weekStart.setHours(0, 0, 0, 0);
            const orders = await this.orderRepository.find({
                where: {
                    shopId: shop.id,
                    status: order_entity_1.OrderStatus.DELIVERED,
                },
            });
            const weekOrders = orders.filter((o) => o.deliveredAt && new Date(o.deliveredAt) >= weekStart && new Date(o.deliveredAt) <= weekEnd);
            const gross = weekOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const commission = weekOrders.reduce((sum, o) => sum + Number(o.commissionAmount), 0);
            const net = gross - commission;
            weeks.push({
                weekLabel: `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
                orderCount: weekOrders.length,
                gross,
                commission,
                net,
            });
        }
        const currentWeek = weeks[weeks.length - 1];
        const previousWeek = weeks[weeks.length - 2];
        const growth = previousWeek && previousWeek.net > 0
            ? Math.round(((currentWeek.net - previousWeek.net) / previousWeek.net) * 100)
            : 0;
        return {
            weeks,
            currentWeek,
            growth,
        };
    }
    async getPayouts(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.transactionRepository.find({
            where: {
                order: { shopId: shop.id },
                type: transaction_entity_1.TransactionType.SETTLEMENT,
                status: transaction_entity_1.TransactionStatus.SUCCESS,
            },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.EarningsService = EarningsService;
exports.EarningsService = EarningsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EarningsService);
//# sourceMappingURL=earnings.service.js.map