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
var FraudDetectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudDetectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../core/entities/order.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const return_request_entity_1 = require("../../core/entities/return-request.entity");
const ioredis_1 = require("ioredis");
const ioredis_2 = require("@nestjs-modules/ioredis");
let FraudDetectionService = FraudDetectionService_1 = class FraudDetectionService {
    orderRepository;
    userRepository;
    returnRepository;
    redis;
    logger = new common_1.Logger(FraudDetectionService_1.name);
    SUSPICIOUS_THRESHOLDS = {
        codOrdersPerHour: 5,
        returnsRatio: 0.3,
        highValueCod: 2000,
    };
    constructor(orderRepository, userRepository, returnRepository, redis) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.returnRepository = returnRepository;
        this.redis = redis;
    }
    async getSuspiciousOrders() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const highValueCod = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.paymentMethod = :method', { method: order_entity_1.PaymentMethod.COD })
            .andWhere('order.totalAmount > :amount', { amount: this.SUSPICIOUS_THRESHOLDS.highValueCod })
            .andWhere('order.createdAt > :date', { date: oneDayAgo })
            .andWhere('order.status NOT IN (:...statuses)', { statuses: [order_entity_1.OrderStatus.DELIVERED, order_entity_1.OrderStatus.CANCELLED] })
            .leftJoinAndSelect('order.customer', 'customer')
            .getMany();
        return highValueCod;
    }
    async getUserActivity(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return null;
        }
        const totalOrders = await this.orderRepository.count({ where: { customerId: userId } });
        const codOrders = await this.orderRepository.count({
            where: { customerId: userId, paymentMethod: order_entity_1.PaymentMethod.COD },
        });
        const cancelledOrders = await this.orderRepository.count({
            where: { customerId: userId, status: order_entity_1.OrderStatus.CANCELLED },
        });
        const returnRequests = await this.returnRepository.count({
            where: { customerId: userId },
        });
        const ordersLast24h = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.customerId = :userId', { userId })
            .andWhere('order.createdAt > NOW() - INTERVAL \'24 hours\'')
            .getCount();
        const riskScore = this.calculateRiskScore({
            totalOrders,
            codOrders,
            cancelledOrders,
            returnRequests,
            ordersLast24h,
        });
        return {
            userId,
            totalOrders,
            codOrders,
            cancelledOrders,
            returnRequests,
            ordersLast24h,
            riskScore,
            riskLevel: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
        };
    }
    async blacklistUser(userId, reason) {
        await this.userRepository.update({ id: userId }, { isActive: false });
        await this.redis.set(`blacklist:user:${userId}`, reason, 'EX', 30 * 24 * 60 * 60);
        this.logger.log(`User ${userId} blacklisted. Reason: ${reason}`);
        return { message: 'User blacklisted' };
    }
    async assessCodRisk(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['customer'],
        });
        if (!order || order.paymentMethod !== order_entity_1.PaymentMethod.COD) {
            return { risk: 'N/A', reason: 'Not a COD order' };
        }
        const ipKey = `rate:order:${order.customerId}`;
        const recentOrders = await this.redis.get(ipKey);
        const orderCount = parseInt(recentOrders || '0');
        const userActivity = await this.getUserActivity(order.customerId);
        let riskScore = 0;
        const reasons = [];
        if (orderCount > this.SUSPICIOUS_THRESHOLDS.codOrdersPerHour) {
            riskScore += 30;
            reasons.push('High order frequency');
        }
        if (order.totalAmount > this.SUSPICIOUS_THRESHOLDS.highValueCod) {
            riskScore += 25;
            reasons.push('High value COD order');
        }
        if (userActivity.riskScore > 50) {
            riskScore += userActivity.riskScore / 2;
            reasons.push('User has high risk profile');
        }
        return {
            orderId,
            riskScore,
            riskLevel: riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW',
            reasons,
            recommendedAction: riskScore > 60 ? 'Require OTP verification before confirming' : 'Proceed with caution',
        };
    }
    calculateRiskScore(data) {
        let score = 0;
        if (data.ordersLast24h > 10)
            score += 30;
        if (data.cancelledOrders / data.totalOrders > 0.5)
            score += 25;
        if (data.returnRequests / data.totalOrders > this.SUSPICIOUS_THRESHOLDS.returnsRatio)
            score += 20;
        return Math.min(score, 100);
    }
};
exports.FraudDetectionService = FraudDetectionService;
exports.FraudDetectionService = FraudDetectionService = FraudDetectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(return_request_entity_1.ReturnRequest)),
    __param(3, (0, ioredis_2.InjectRedis)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ioredis_1.Redis])
], FraudDetectionService);
//# sourceMappingURL=fraud-detection.service.js.map