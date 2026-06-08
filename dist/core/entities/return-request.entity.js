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
exports.ReturnRequest = exports.ReturnReason = exports.ReturnStatus = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const user_entity_1 = require("./user.entity");
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["PENDING"] = "pending";
    ReturnStatus["APPROVED"] = "approved";
    ReturnStatus["REJECTED"] = "rejected";
    ReturnStatus["PICKUP_SCHEDULED"] = "pickup_scheduled";
    ReturnStatus["PICKED_UP"] = "picked_up";
    ReturnStatus["REFUNDED"] = "refunded";
    ReturnStatus["CANCELLED"] = "cancelled";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
var ReturnReason;
(function (ReturnReason) {
    ReturnReason["DEFECTIVE"] = "defective";
    ReturnReason["WRONG_ITEM"] = "wrong_item";
    ReturnReason["DAMAGED"] = "damaged";
    ReturnReason["NOT_AS_DESCRIBED"] = "not_as_described";
    ReturnReason["OTHER"] = "other";
})(ReturnReason || (exports.ReturnReason = ReturnReason = {}));
let ReturnRequest = class ReturnRequest {
    id;
    order;
    orderId;
    customer;
    customerId;
    shopId;
    reason;
    description;
    evidenceImages;
    evidenceVideo;
    status;
    refundAmount;
    rejectionReason;
    pickupAddress;
    pickupScheduledAt;
    pickupContactPhone;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.ReturnRequest = ReturnRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReturnRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_entity_1.Order, (order) => order.returnRequest),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", order_entity_1.Order)
], ReturnRequest.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReturnRequest.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.returnRequests),
    __metadata("design:type", user_entity_1.User)
], ReturnRequest.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReturnRequest.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReturnRequest.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ReturnReason }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], ReturnRequest.prototype, "evidenceImages", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "evidenceVideo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ReturnRequest.prototype, "refundAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], ReturnRequest.prototype, "pickupScheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReturnRequest.prototype, "pickupContactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], ReturnRequest.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReturnRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReturnRequest.prototype, "updatedAt", void 0);
exports.ReturnRequest = ReturnRequest = __decorate([
    (0, typeorm_1.Entity)('return_requests')
], ReturnRequest);
//# sourceMappingURL=return-request.entity.js.map