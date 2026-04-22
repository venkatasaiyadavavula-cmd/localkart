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
exports.UpdateReturnStatusDto = exports.CreateReturnRequestDto = void 0;
const class_validator_1 = require("class-validator");
const return_request_entity_1 = require("../../../core/entities/return-request.entity");
class CreateReturnRequestDto {
    orderId;
    reason;
    description;
}
exports.CreateReturnRequestDto = CreateReturnRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReturnRequestDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(return_request_entity_1.ReturnReason),
    __metadata("design:type", String)
], CreateReturnRequestDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReturnRequestDto.prototype, "description", void 0);
class UpdateReturnStatusDto {
    status;
    notes;
}
exports.UpdateReturnStatusDto = UpdateReturnStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(return_request_entity_1.ReturnStatus),
    __metadata("design:type", String)
], UpdateReturnStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReturnStatusDto.prototype, "notes", void 0);
//# sourceMappingURL=return-request.dto.js.map