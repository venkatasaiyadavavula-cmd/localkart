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
exports.StaffMember = exports.StaffStatus = exports.StaffRole = void 0;
const typeorm_1 = require("typeorm");
const shop_entity_1 = require("./shop.entity");
var StaffRole;
(function (StaffRole) {
    StaffRole["PRODUCTS_MANAGER"] = "products_manager";
    StaffRole["DELIVERY_STAFF"] = "delivery_staff";
    StaffRole["STORE_MANAGER"] = "store_manager";
})(StaffRole || (exports.StaffRole = StaffRole = {}));
var StaffStatus;
(function (StaffStatus) {
    StaffStatus["ACTIVE"] = "active";
    StaffStatus["INACTIVE"] = "inactive";
})(StaffStatus || (exports.StaffStatus = StaffStatus = {}));
let StaffMember = class StaffMember {
    id;
    shop;
    shopId;
    name;
    phone;
    staffId;
    passwordHash;
    role;
    status;
    lastLoginAt;
    note;
    createdAt;
    updatedAt;
};
exports.StaffMember = StaffMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StaffMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop, { onDelete: 'CASCADE' }),
    __metadata("design:type", shop_entity_1.Shop)
], StaffMember.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StaffMember.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], StaffMember.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 15, unique: true }),
    __metadata("design:type", String)
], StaffMember.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, unique: true }),
    __metadata("design:type", String)
], StaffMember.prototype, "staffId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StaffMember.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StaffRole }),
    __metadata("design:type", String)
], StaffMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE }),
    __metadata("design:type", String)
], StaffMember.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], StaffMember.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], StaffMember.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StaffMember.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StaffMember.prototype, "updatedAt", void 0);
exports.StaffMember = StaffMember = __decorate([
    (0, typeorm_1.Entity)('staff_members'),
    (0, typeorm_1.Index)(['shopId', 'status']),
    (0, typeorm_1.Index)(['staffId', 'shopId'], { unique: true })
], StaffMember);
//# sourceMappingURL=staff-member.entity.js.map