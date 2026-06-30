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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CommissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const commission_bill_entity_1 = require("../../core/entities/commission-bill.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
const razorpay_config_1 = __importDefault(require("../../config/razorpay.config"));
const FINE_PER_DAY = 25;
let CommissionService = CommissionService_1 = class CommissionService {
    billRepo;
    orderRepo;
    shopRepo;
    dataSource;
    whatsappService;
    logger = new common_1.Logger(CommissionService_1.name);
    constructor(billRepo, orderRepo, shopRepo, dataSource, whatsappService) {
        this.billRepo = billRepo;
        this.orderRepo = orderRepo;
        this.shopRepo = shopRepo;
        this.dataSource = dataSource;
        this.whatsappService = whatsappService;
    }
    async generateDailyBills() {
        this.logger.log('⏰ Daily commission bill generation started');
        const today = new Date().toISOString().split('T')[0];
        const shops = await this.shopRepo.find({ where: { status: 'approved' } });
        for (const shop of shops) {
            await this.generateBillForShop(shop.id, today);
        }
        this.logger.log(`✅ Bills generated for ${shops.length} shops`);
    }
    async applyDailyFines() {
        this.logger.log('💰 Applying fines to overdue bills');
        const unpaidBills = await this.billRepo.find({
            where: { status: commission_bill_entity_1.CommissionBillStatus.PENDING },
            relations: ['shop'],
        });
        for (const bill of unpaidBills) {
            const billDate = new Date(bill.billDate);
            const today = new Date();
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysLate = Math.floor((today.getTime() - billDate.getTime()) / msPerDay);
            if (daysLate > 0) {
                bill.daysOverdue = daysLate;
                bill.fineAmount = daysLate * FINE_PER_DAY;
                bill.status = commission_bill_entity_1.CommissionBillStatus.OVERDUE;
                await this.billRepo.save(bill);
            }
        }
    }
    async sendReminders() {
        const unpaid = await this.billRepo.find({
            where: [
                { status: commission_bill_entity_1.CommissionBillStatus.PENDING },
                { status: commission_bill_entity_1.CommissionBillStatus.OVERDUE },
            ],
            relations: ['shop', 'shop.owner'],
        });
        for (const bill of unpaid) {
            const total = Number(bill.commissionAmount) + Number(bill.fineAmount);
            this.logger.log(`📲 Reminder → ${bill.shop.name} | Due: ₹${total}`);
            if (bill.shop?.phone) {
                this.whatsappService.sendCommissionReminder(bill.shop.contactPhone, bill.shop.name, bill.billDate, Number(bill.commissionAmount), Number(bill.fineAmount), bill.daysOverdue).catch((e) => this.logger.error('WA commission reminder failed: ' + e.message));
            }
        }
    }
    async generateBillForShop(shopId, date) {
        const existing = await this.billRepo.findOne({ where: { shopId, billDate: date } });
        if (existing)
            return existing;
        const startOfDay = new Date(date + 'T00:00:00+05:30');
        const endOfDay = new Date(date + 'T23:59:59+05:30');
        const orders = await this.orderRepo.find({
            where: {
                shopId,
                status: order_entity_1.OrderStatus.DELIVERED,
                createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
        });
        if (orders.length === 0)
            return null;
        const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const commissionAmount = parseFloat(orders.reduce((sum, o) => sum + Number(o.commissionAmount), 0).toFixed(2));
        const commissionPercent = totalOrderValue > 0
            ? parseFloat(((commissionAmount / totalOrderValue) * 100).toFixed(2))
            : 0;
        const bill = this.billRepo.create({
            shopId,
            billDate: date,
            orderCount: orders.length,
            totalOrderValue,
            commissionAmount,
            commissionPercent,
            fineAmount: 0,
            status: commission_bill_entity_1.CommissionBillStatus.PENDING,
        });
        return this.billRepo.save(bill);
    }
    async createCommissionPaymentOrder(shopId, billId) {
        const bill = await this.billRepo.findOne({
            where: { id: billId, shopId },
            relations: ['shop'],
        });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        if (bill.status === commission_bill_entity_1.CommissionBillStatus.PAID)
            throw new common_1.BadRequestException('Bill already paid');
        const totalDue = Number(bill.commissionAmount) + Number(bill.fineAmount);
        const amountPaise = Math.round(totalDue * 100);
        const rzpOrder = await razorpay_config_1.default.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: `comm_${bill.id}`,
            payment_capture: true,
            notes: {
                type: 'commission',
                billId: bill.id,
                shopId,
                billDate: bill.billDate,
            },
        });
        await this.billRepo.update(bill.id, { razorpayOrderId: rzpOrder.id });
        return {
            razorpayOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
            billDetails: {
                billDate: bill.billDate,
                orderCount: bill.orderCount,
                commissionAmount: bill.commissionAmount,
                fineAmount: bill.fineAmount,
                totalDue,
                daysOverdue: bill.daysOverdue,
            },
        };
    }
    async verifyCommissionPayment(shopId, billId, razorpayPaymentId, razorpayOrderId, razorpaySignature) {
        const crypto = require('crypto');
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');
        if (expectedSig !== razorpaySignature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        await this.billRepo.update(billId, {
            status: commission_bill_entity_1.CommissionBillStatus.PAID,
            razorpayPaymentId,
            paidAt: new Date(),
        });
        return { success: true, message: 'Commission payment confirmed' };
    }
    async getShopBills(shopId, page = 1, limit = 30) {
        const [bills, total] = await this.billRepo.findAndCount({
            where: { shopId },
            order: { billDate: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        const totalPending = bills
            .filter(b => b.status !== commission_bill_entity_1.CommissionBillStatus.PAID)
            .reduce((sum, b) => sum + Number(b.commissionAmount) + Number(b.fineAmount), 0);
        return { bills, total, totalPending, page, limit };
    }
    async getOverdueShops() {
        return this.billRepo.find({
            where: { status: commission_bill_entity_1.CommissionBillStatus.OVERDUE },
            relations: ['shop', 'shop.owner'],
            order: { daysOverdue: 'DESC' },
        });
    }
};
exports.CommissionService = CommissionService;
__decorate([
    (0, schedule_1.Cron)('0 22 * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionService.prototype, "generateDailyBills", null);
__decorate([
    (0, schedule_1.Cron)('5 22 * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionService.prototype, "applyDailyFines", null);
__decorate([
    (0, schedule_1.Cron)('10 22 * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionService.prototype, "sendReminders", null);
exports.CommissionService = CommissionService = CommissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(commission_bill_entity_1.CommissionBill)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        whatsapp_service_1.WhatsappService])
], CommissionService);
//# sourceMappingURL=commission.service.js.map