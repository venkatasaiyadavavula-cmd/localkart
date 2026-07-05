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
exports.ShopToggleDto = void 0;
const class_validator_1 = require("class-validator");
const shop_entity_1 = require("../../../core/entities/shop.entity");
class ShopToggleDto {
    manualOverride;
    resetToSchedule;
}
exports.ShopToggleDto = ShopToggleDto;
__decorate([
    (0, class_validator_1.IsEnum)(shop_entity_1.ManualOverride),
    __metadata("design:type", String)
], ShopToggleDto.prototype, "manualOverride", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ShopToggleDto.prototype, "resetToSchedule", void 0);
//# sourceMappingURL=shop-toggle.dto.js.map