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
var WeeklyEarningsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyEarningsScheduler = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const order_entity_1 = require("../../core/entities/order.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const commission_bill_entity_1 = require("../../core/entities/commission-bill.entity");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
let WeeklyEarningsScheduler = WeeklyEarningsScheduler_1 = class WeeklyEarningsScheduler {
    orderRepo;
    shopRepo;
    billRepo;
    whatsappService;
    logger = new common_1.Logger(WeeklyEarningsScheduler_1.name);
    constructor(orderRepo, shopRepo, billRepo, whatsappService) {
        this.orderRepo = orderRepo;
        this.shopRepo = shopRepo;
        this.billRepo = billRepo;
        this.whatsappService = whatsappService;
    }
    async sendWeeklyEarnings() {
        this.logger.log('📊 Sending weekly earnings summaries...');
        const now = new Date();
        const friday = new Date(now);
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        friday.setHours(23, 59, 59, 999);
        const weekLabel = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
        const shops = await this.shopRepo.find({ where: { status: 'approved' } });
        let sent = 0;
        for (const shop of shops) {
            if (!shop.contactPhone)
                continue;
            const orders = await this.orderRepo.find({
                where: {
                    shopId: shop.id,
                    status: order_entity_1.OrderStatus.DELIVERED,
                    createdAt: (0, typeorm_2.Between)(monday, friday),
                },
            });
            if (orders.length === 0)
                continue;
            const grossEarnings = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
            const commission = orders.reduce((s, o) => s + Number(o.commissionAmount ?? 0), 0);
            const netEarnings = grossEarnings - commission;
            await this.whatsappService.sendWeeklyEarningsSummary(shop.contactPhone, shop.name, weekLabel, orders.length, grossEarnings, commission, netEarnings).catch(e => this.logger.error(`Weekly earnings WA failed for ${shop.name}: ${e.message}`));
            sent++;
        }
        this.logger.log(`✅ Weekly earnings sent to ${sent} shops`);
    }
    async getWeeklyEarningsData(shopId) {
        const weeks = [];
        for (let w = 0; w < 8; w++) {
            const monday = new Date();
            monday.setDate(monday.getDate() - monday.getDay() - 6 - w * 7 + 1);
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            const orders = await this.orderRepo.find({
                where: {
                    shopId,
                    status: order_entity_1.OrderStatus.DELIVERED,
                    createdAt: (0, typeorm_2.Between)(monday, sunday),
                },
            });
            const gross = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
            const commission = orders.reduce((s, o) => s + Number(o.commissionAmount ?? 0), 0);
            weeks.unshift({
                weekLabel: `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
                orderCount: orders.length,
                gross: parseFloat(gross.toFixed(2)),
                commission: parseFloat(commission.toFixed(2)),
                net: parseFloat((gross - commission).toFixed(2)),
            });
        }
        const currentWeek = weeks[weeks.length - 1];
        const lastWeek = weeks[weeks.length - 2];
        const growth = lastWeek?.net > 0
            ? parseFloat((((currentWeek.net - lastWeek.net) / lastWeek.net) * 100).toFixed(1))
            : 0;
        return { weeks, growth, currentWeek };
    }
};
exports.WeeklyEarningsScheduler = WeeklyEarningsScheduler;
__decorate([
    (0, schedule_1.Cron)('0 21 * * 5', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WeeklyEarningsScheduler.prototype, "sendWeeklyEarnings", null);
exports.WeeklyEarningsScheduler = WeeklyEarningsScheduler = WeeklyEarningsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(2, (0, typeorm_1.InjectRepository)(commission_bill_entity_1.CommissionBill)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        whatsapp_service_1.WhatsappService])
], WeeklyEarningsScheduler);
//# sourceMappingURL=weekly-earnings.scheduler.js.map