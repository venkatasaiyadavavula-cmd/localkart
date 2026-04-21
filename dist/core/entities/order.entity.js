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
exports.Order = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const shop_entity_1 = require("./shop.entity");
const order_item_entity_1 = require("./order-item.entity");
const transaction_entity_1 = require("./transaction.entity");
const return_request_entity_1 = require("./return-request.entity");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING_OTP"] = "pending_otp";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["READY_FOR_PICKUP"] = "ready_for_pickup";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["RETURN_REQUESTED"] = "return_requested";
    OrderStatus["RETURNED"] = "returned";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "cod";
    PaymentMethod["RAZORPAY"] = "razorpay";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let Order = class Order {
    id;
    orderNumber;
    customer;
    customerId;
    shop;
    shopId;
    items;
    subtotal;
    deliveryCharge;
    discount;
    totalAmount;
    commissionAmount;
    commissionRate;
    paymentMethod;
    paymentStatus;
    status;
    shippingAddress;
    deliveryOtp;
    deliveryNotes;
    cancellationReason;
    confirmedAt;
    deliveredAt;
    cancelledAt;
    transactions;
    returnRequest;
    createdAt;
    updatedAt;
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Order.prototype, "orderNumber", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.orders),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop, (shop) => shop.orders),
    __metadata("design:type", shop_entity_1.Shop)
], Order.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Order.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (item) => item.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "deliveryCharge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "commissionAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "commissionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_OTP }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryOtp", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Order.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Order.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Order.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (transaction) => transaction.order),
    __metadata("design:type", Array)
], Order.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => return_request_entity_1.ReturnRequest, (returnRequest) => returnRequest.order),
    __metadata("design:type", return_request_entity_1.ReturnRequest)
], Order.prototype, "returnRequest", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['customerId', 'createdAt']),
    (0, typeorm_1.Index)(['shopId', 'status']),
    (0, typeorm_1.Index)(['orderNumber'], { unique: true })
], Order);
//# sourceMappingURL=order.entity.js.map