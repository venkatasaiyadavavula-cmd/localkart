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
exports.DailyOffer = void 0;
const typeorm_1 = require("typeorm");
const shop_entity_1 = require("./shop.entity");
const product_entity_1 = require("./product.entity");
let DailyOffer = class DailyOffer {
    id;
    shopId;
    shop;
    productId;
    product;
    offerPrice;
    originalPrice;
    discountPercentage;
    startsAt;
    expiresAt;
    isActive;
    createdAt;
};
exports.DailyOffer = DailyOffer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DailyOffer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DailyOffer.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop),
    (0, typeorm_1.JoinColumn)({ name: 'shopId' }),
    __metadata("design:type", shop_entity_1.Shop)
], DailyOffer.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DailyOffer.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], DailyOffer.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], DailyOffer.prototype, "offerPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], DailyOffer.prototype, "originalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], DailyOffer.prototype, "discountPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], DailyOffer.prototype, "startsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DailyOffer.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DailyOffer.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DailyOffer.prototype, "createdAt", void 0);
exports.DailyOffer = DailyOffer = __decorate([
    (0, typeorm_1.Entity)('daily_offers')
], DailyOffer);
//# sourceMappingURL=daily-offer.entity.js.map