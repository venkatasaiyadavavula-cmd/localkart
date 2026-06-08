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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../../core/entities/shop.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
let AdminService = class AdminService {
    shopRepository;
    productRepository;
    orderRepository;
    userRepository;
    transactionRepository;
    constructor(shopRepository, productRepository, orderRepository, userRepository, transactionRepository) {
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }
    async getDashboardStats() {
        const totalShops = await this.shopRepository.count();
        const totalProducts = await this.productRepository.count();
        const totalOrders = await this.orderRepository.count();
        const totalUsers = await this.userRepository.count();
        const totalRevenue = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .where('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .getRawOne();
        const totalCommission = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.commissionAmount)', 'commission')
            .where('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .getRawOne();
        const pendingShops = await this.shopRepository.count({
            where: { status: 'pending' },
        });
        const pendingProducts = await this.productRepository.count({
            where: { status: 'pending' },
        });
        const todayOrders = await this.orderRepository
            .createQueryBuilder('order')
            .where('DATE(order.createdAt) = CURRENT_DATE')
            .getCount();
        return {
            totalShops,
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue: totalRevenue?.total || 0,
            totalCommission: totalCommission?.commission || 0,
            pendingShops,
            pendingProducts,
            todayOrders,
        };
    }
    async getRevenueChart(period) {
        let interval;
        switch (period) {
            case 'week':
                interval = '7 days';
                break;
            case 'month':
                interval = '30 days';
                break;
            case 'year':
                interval = '12 months';
                break;
            default:
                interval = '30 days';
        }
        const revenue = await this.orderRepository
            .createQueryBuilder('order')
            .select(`DATE_TRUNC('day', order.createdAt)`, 'date')
            .addSelect('SUM(order.totalAmount)', 'revenue')
            .addSelect('SUM(order.commissionAmount)', 'commission')
            .where('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere(`order.createdAt >= NOW() - INTERVAL '${interval}'`)
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();
        return revenue;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map