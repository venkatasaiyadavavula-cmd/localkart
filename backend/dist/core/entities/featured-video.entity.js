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
exports.FeaturedVideo = exports.FeaturedVideoStatus = void 0;
const typeorm_1 = require("typeorm");
const shop_entity_1 = require("./shop.entity");
const product_entity_1 = require("./product.entity");
var FeaturedVideoStatus;
(function (FeaturedVideoStatus) {
    FeaturedVideoStatus["ACTIVE"] = "active";
    FeaturedVideoStatus["EXPIRED"] = "expired";
    FeaturedVideoStatus["PENDING"] = "pending";
})(FeaturedVideoStatus || (exports.FeaturedVideoStatus = FeaturedVideoStatus = {}));
let FeaturedVideo = class FeaturedVideo {
    id;
    shopId;
    shop;
    productId;
    product;
    videoUrl;
    amount;
    status;
    expiresAt;
    createdAt;
};
exports.FeaturedVideo = FeaturedVideo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeaturedVideo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FeaturedVideo.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop),
    (0, typeorm_1.JoinColumn)({ name: 'shopId' }),
    __metadata("design:type", shop_entity_1.Shop)
], FeaturedVideo.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FeaturedVideo.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], FeaturedVideo.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], FeaturedVideo.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 29 }),
    __metadata("design:type", Number)
], FeaturedVideo.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: FeaturedVideoStatus, default: FeaturedVideoStatus.ACTIVE }),
    __metadata("design:type", String)
], FeaturedVideo.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FeaturedVideo.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FeaturedVideo.prototype, "createdAt", void 0);
exports.FeaturedVideo = FeaturedVideo = __decorate([
    (0, typeorm_1.Entity)('featured_videos'),
    (0, typeorm_1.Index)(['status', 'expiresAt']),
    (0, typeorm_1.Index)(['shopId', 'productId'])
], FeaturedVideo);
//# sourceMappingURL=featured-video.entity.js.map