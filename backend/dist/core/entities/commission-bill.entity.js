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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionBill = exports.CommissionBillStatus = void 0;
const typeorm_1 = require("typeorm");
const shop_entity_1 = require("./shop.entity");
var CommissionBillStatus;
(function (CommissionBillStatus) {
    CommissionBillStatus["PENDING"] = "pending";
    CommissionBillStatus["PAID"] = "paid";
    CommissionBillStatus["OVERDUE"] = "overdue";
})(CommissionBillStatus || (exports.CommissionBillStatus = CommissionBillStatus = {}));
let CommissionBill = class CommissionBill {
    id;
    shop;
    shopId;
    billDate;
    orderCount;
    totalOrderValue;
    commissionAmount;
    commissionPercent;
    fineAmount;
    daysOverdue;
    status;
    razorpayOrderId;
    razorpayPaymentId;
    paidAt;
    reminderSentAt;
    createdAt;
    updatedAt;
};
exports.CommissionBill = CommissionBill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CommissionBill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop, { onDelete: 'CASCADE' }),
    __metadata("design:type", shop_entity_1.Shop)
], CommissionBill.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CommissionBill.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], CommissionBill.prototype, "billDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "orderCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "totalOrderValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "commissionAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 10 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "commissionPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "fineAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CommissionBill.prototype, "daysOverdue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CommissionBillStatus,
        default: CommissionBillStatus.PENDING,
    }),
    __metadata("design:type", String)
], CommissionBill.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CommissionBill.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CommissionBill.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], CommissionBill.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], CommissionBill.prototype, "reminderSentAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CommissionBill.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CommissionBill.prototype, "updatedAt", void 0);
exports.CommissionBill = CommissionBill = __decorate([
    (0, typeorm_1.Entity)('commission_bills'),
    (0, typeorm_1.Index)(['shopId', 'billDate']),
    (0, typeorm_1.Index)(['status', 'billDate'])
], CommissionBill);
//# sourceMappingURL=commission-bill.entity.js.map