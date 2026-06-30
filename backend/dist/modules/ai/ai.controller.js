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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const ai_service_1 = require("./ai.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async scanProduct(files) {
        if (!files?.length)
            throw new common_1.BadRequestException('Upload at least one product image');
        const result = await this.aiService.processProductImages(files);
        return {
            success: true,
            data: {
                name: result.suggestedName,
                price: result.suggestedPrice,
                unit: result.suggestedUnit,
                description: result.suggestedDescription,
                category: result.suggestedCategory,
                confidence: result.confidence,
            },
            message: result.confidence >= 75
                ? 'Product scanned successfully!'
                : 'Partial scan — please verify the details.',
        };
    }
    async generateDescription(req) {
        const { name, category, price, unit } = req.body;
        if (!name)
            throw new common_1.BadRequestException('Product name is required');
        const catLabels = {
            groceries: 'Fresh grocery product',
            electronics: 'Quality electronics product',
            fashion: 'Trendy fashion item',
            beauty: 'Premium beauty product',
            home_essentials: 'Essential home product',
            accessories: 'Stylish accessory',
            sports: 'Sports and fitness product',
            books: 'Book or educational material',
        };
        const base = catLabels[category] ?? 'Quality product';
        const parts = [`${base} — ${name}.`];
        if (unit)
            parts.push(`Available in ${unit} pack.`);
        if (price)
            parts.push(`Best price at ₹${price}.`);
        parts.push('Sold by a trusted local shop on LocalKart. Fast delivery available.');
        return {
            success: true,
            description: parts.join(' ').substring(0, 400),
        };
    }
    async triggerStockCheck() {
        return this.aiService.manualStockCheck();
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('scan-product'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, {
        storage: (0, multer_1.memoryStorage)(),
        fileFilter: (_, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new common_1.BadRequestException('Only image files allowed'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "scanProduct", null);
__decorate([
    (0, common_1.Post)('generate-description'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateDescription", null);
__decorate([
    (0, common_1.Post)('admin/check-stock'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "triggerStockCheck", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map