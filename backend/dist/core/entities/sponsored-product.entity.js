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
exports.SponsoredProduct = exports.AdType = exports.AdStatus = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const shop_entity_1 = require("./shop.entity");
var AdStatus;
(function (AdStatus) {
    AdStatus["PENDING"] = "pending";
    AdStatus["ACTIVE"] = "active";
    AdStatus["PAUSED"] = "paused";
    AdStatus["EXPIRED"] = "expired";
    AdStatus["CANCELLED"] = "cancelled";
})(AdStatus || (exports.AdStatus = AdStatus = {}));
var AdType;
(function (AdType) {
    AdType["SPONSORED"] = "sponsored";
    AdType["VIDEO"] = "video";
})(AdType || (exports.AdType = AdType = {}));
let SponsoredProduct = class SponsoredProduct {
    id;
    product;
    productId;
    shop;
    shopId;
    adType;
    status;
    costPerDay;
    startDate;
    endDate;
    totalCost;
    impressions;
    clicks;
    razorpayPaymentId;
    targeting;
    createdAt;
    updatedAt;
};
exports.SponsoredProduct = SponsoredProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.sponsoredCampaigns, { onDelete: 'CASCADE' }),
    __metadata("design:type", product_entity_1.Product)
], SponsoredProduct.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop),
    __metadata("design:type", shop_entity_1.Shop)
], SponsoredProduct.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AdType }),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "adType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AdStatus, default: AdStatus.PENDING }),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SponsoredProduct.prototype, "costPerDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], SponsoredProduct.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], SponsoredProduct.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SponsoredProduct.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SponsoredProduct.prototype, "impressions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SponsoredProduct.prototype, "clicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SponsoredProduct.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SponsoredProduct.prototype, "targeting", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SponsoredProduct.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SponsoredProduct.prototype, "updatedAt", void 0);
exports.SponsoredProduct = SponsoredProduct = __decorate([
    (0, typeorm_1.Entity)('sponsored_products'),
    (0, typeorm_1.Index)(['productId', 'status']),
    (0, typeorm_1.Index)(['shopId'])
], SponsoredProduct);
//# sourceMappingURL=sponsored-product.entity.js.map