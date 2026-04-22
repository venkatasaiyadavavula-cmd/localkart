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
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../core/entities/order.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const category_entity_1 = require("../../core/entities/category.entity");
const product_entity_1 = require("../../core/entities/product.entity");
let CommissionService = class CommissionService {
    orderRepository;
    transactionRepository;
    shopRepository;
    categoryRepository;
    commissionRates = {
        [product_entity_1.ProductCategoryType.GROCERIES]: 2,
        [product_entity_1.ProductCategoryType.FASHION]: 4,
        [product_entity_1.ProductCategoryType.ELECTRONICS]: 3,
        [product_entity_1.ProductCategoryType.HOME_ESSENTIALS]: 4,
        [product_entity_1.ProductCategoryType.BEAUTY]: 5,
        [product_entity_1.ProductCategoryType.ACCESSORIES]: 5,
    };
    constructor(orderRepository, transactionRepository, shopRepository, categoryRepository) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.shopRepository = shopRepository;
        this.categoryRepository = categoryRepository;
    }
    async getCommissionSummary(period) {
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .where('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED });
        if (period) {
            const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : '365 days';
            queryBuilder.andWhere(`order.deliveredAt >= NOW() - INTERVAL '${interval}'`);
        }
        const summary = await queryBuilder
            .select('SUM(order.commissionAmount)', 'totalCommission')
            .addSelect('COUNT(*)', 'orderCount')
            .addSelect('SUM(order.totalAmount)', 'totalRevenue')
            .getRawOne();
        const pendingSettlements = await this.orderRepository
            .createQueryBuilder('order')
            .leftJoin('order.transactions', 't', 't.type = :type', { type: transaction_entity_1.TransactionType.SETTLEMENT })
            .where('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere('t.id IS NULL')
            .select('SUM(order.totalAmount - order.commissionAmount)', 'pending')
            .getRawOne();
        return {
            totalCommission: summary?.totalCommission || 0,
            totalRevenue: summary?.totalRevenue || 0,
            orderCount: summary?.orderCount || 0,
            pendingSettlements: pendingSettlements?.pending || 0,
            currentRates: this.commissionRates,
        };
    }
    async getCommissionTransactions(page, limit) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { type: transaction_entity_1.TransactionType.COMMISSION },
            relations: ['order', 'order.shop'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: transactions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async updateCategoryCommission(categoryType, rate) {
        if (!Object.values(product_entity_1.ProductCategoryType).includes(categoryType)) {
            throw new common_1.NotFoundException('Invalid category type');
        }
        this.commissionRates[categoryType] = rate;
        return { message: 'Commission rate updated', rates: this.commissionRates };
    }
    async settleShopEarnings(shopId) {
        const shop = await this.shopRepository.findOne({ where: { id: shopId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const unsettledOrders = await this.orderRepository
            .createQueryBuilder('order')
            .leftJoin('order.transactions', 't', 't.type = :type', { type: transaction_entity_1.TransactionType.SETTLEMENT })
            .where('order.shopId = :shopId', { shopId })
            .andWhere('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere('t.id IS NULL')
            .getMany();
        const totalSettlement = unsettledOrders.reduce((sum, order) => sum + (order.totalAmount - order.commissionAmount), 0);
        if (totalSettlement === 0) {
            return { message: 'No pending settlements' };
        }
        const settlement = this.transactionRepository.create({
            type: transaction_entity_1.TransactionType.SETTLEMENT,
            status: transaction_entity_1.TransactionStatus.SUCCESS,
            amount: totalSettlement,
            currency: 'INR',
            metadata: { shopId, orderIds: unsettledOrders.map(o => o.id) },
        });
        await this.transactionRepository.save(settlement);
        shop.totalEarnings += totalSettlement;
        await this.shopRepository.save(shop);
        return { message: 'Settlement processed', amount: totalSettlement };
    }
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(3, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CommissionService);
//# sourceMappingURL=commission.service.js.map