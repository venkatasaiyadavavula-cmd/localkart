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
exports.Shop = exports.ShopStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const product_entity_1 = require("./product.entity");
const order_entity_1 = require("./order.entity");
const subscription_entity_1 = require("./subscription.entity");
var ShopStatus;
(function (ShopStatus) {
    ShopStatus["PENDING"] = "pending";
    ShopStatus["APPROVED"] = "approved";
    ShopStatus["REJECTED"] = "rejected";
    ShopStatus["SUSPENDED"] = "suspended";
})(ShopStatus || (exports.ShopStatus = ShopStatus = {}));
let Shop = class Shop {
    id;
    name;
    slug;
    description;
    address;
    city;
    state;
    pincode;
    location;
    latitude;
    longitude;
    bannerImage;
    logoImage;
    contactPhone;
    contactEmail;
    status;
    totalProducts;
    totalOrders;
    totalEarnings;
    rating;
    reviewCount;
    openingTime;
    closingTime;
    deliveryPincodes;
    deliveryCharge;
    freeDeliveryAbove;
    fssaiLicense;
    gstNumber;
    panCard;
    owner;
    ownerId;
    products;
    orders;
    subscriptions;
    createdAt;
    updatedAt;
};
exports.Shop = Shop;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Shop.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Shop.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], Shop.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Shop.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Shop.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Shop.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], Shop.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", String)
], Shop.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Shop.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Shop.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "bannerImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "logoImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 15 }),
    __metadata("design:type", String)
], Shop.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Shop.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ShopStatus, default: ShopStatus.PENDING }),
    __metadata("design:type", String)
], Shop.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "totalProducts", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "totalOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "totalEarnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "openingTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "closingTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Shop.prototype, "deliveryPincodes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "deliveryCharge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Shop.prototype, "freeDeliveryAbove", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "fssaiLicense", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "gstNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Shop.prototype, "panCard", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.shop),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", user_entity_1.User)
], Shop.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Shop.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_entity_1.Product, (product) => product.shop),
    __metadata("design:type", Array)
], Shop.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.shop),
    __metadata("design:type", Array)
], Shop.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subscription_entity_1.Subscription, (subscription) => subscription.shop),
    __metadata("design:type", Array)
], Shop.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Shop.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Shop.prototype, "updatedAt", void 0);
exports.Shop = Shop = __decorate([
    (0, typeorm_1.Entity)('shops')
], Shop);
//# sourceMappingURL=shop.entity.js.map