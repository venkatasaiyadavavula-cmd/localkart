"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const XLSX = __importStar(require("xlsx"));
const slugify_1 = __importDefault(require("slugify"));
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
const catalog_service_1 = require("./catalog.service");
const PLAN_LIMITS = {
    [subscription_entity_1.SubscriptionPlan.STARTER]: 40,
    [subscription_entity_1.SubscriptionPlan.GROWTH]: 150,
    [subscription_entity_1.SubscriptionPlan.BUSINESS]: 500,
};
const CATEGORY_ALIASES = {
    groceries: product_entity_1.ProductCategoryType.GROCERIES,
    grocery: product_entity_1.ProductCategoryType.GROCERIES,
    fashion: product_entity_1.ProductCategoryType.FASHION,
    electronics: product_entity_1.ProductCategoryType.ELECTRONICS,
    electronic: product_entity_1.ProductCategoryType.ELECTRONICS,
    home_essentials: product_entity_1.ProductCategoryType.HOME_ESSENTIALS,
    'home essentials': product_entity_1.ProductCategoryType.HOME_ESSENTIALS,
    home: product_entity_1.ProductCategoryType.HOME_ESSENTIALS,
    beauty: product_entity_1.ProductCategoryType.BEAUTY,
    accessories: product_entity_1.ProductCategoryType.ACCESSORIES,
    accessory: product_entity_1.ProductCategoryType.ACCESSORIES,
};
let BulkUploadService = class BulkUploadService {
    productRepository;
    shopRepository;
    subscriptionRepository;
    catalogService;
    constructor(productRepository, shopRepository, subscriptionRepository, catalogService) {
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.catalogService = catalogService;
    }
    generateTemplate() {
        const rows = [
            {
                name: 'Sample Product',
                price: 99,
                category: 'groceries',
                mrp: 120,
                stock: 50,
                description: 'Product description here',
                brand: 'BrandName',
                unit: '1kg',
            },
        ];
        const sheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    async processUpload(userId, file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const shop = await this.shopRepository.findOne({
            where: { ownerId: userId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop) {
            throw new common_1.ForbiddenException('Approved shop required for bulk upload');
        }
        const limitInfo = await this.catalogService.getSellerProductLimit(userId);
        let remaining = limitInfo.remaining;
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const result = {
            total: rows.length,
            created: 0,
            skipped: 0,
            errors: [],
        };
        for (let i = 0; i < rows.length; i++) {
            const rowNum = i + 2;
            const row = rows[i];
            try {
                const name = String(row.name ?? row.Name ?? '').trim();
                const price = Number(row.price ?? row.Price);
                const categoryRaw = String(row.category ?? row.Category ?? '').trim().toLowerCase();
                if (!name) {
                    result.skipped++;
                    result.errors.push({ row: rowNum, reason: 'Product name is required' });
                    continue;
                }
                if (!price || price <= 0) {
                    result.skipped++;
                    result.errors.push({ row: rowNum, reason: 'Valid price is required' });
                    continue;
                }
                const categoryType = CATEGORY_ALIASES[categoryRaw];
                if (!categoryType) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        reason: `Invalid category "${categoryRaw}". Use groceries, fashion, electronics, home_essentials, beauty, or accessories`,
                    });
                    continue;
                }
                if (remaining <= 0) {
                    result.skipped++;
                    result.errors.push({ row: rowNum, reason: 'Product plan limit reached' });
                    continue;
                }
                const mrpVal = row.mrp ?? row.MRP;
                const stockVal = row.stock ?? row.Stock ?? 0;
                const descriptionBase = String(row.description ?? row.Description ?? '').trim();
                const unit = String(row.unit ?? row.Unit ?? '').trim();
                const description = [descriptionBase, unit ? `Unit: ${unit}` : ''].filter(Boolean).join(' — ') || undefined;
                const brand = String(row.brand ?? row.Brand ?? '').trim() || undefined;
                const product = this.productRepository.create({
                    name,
                    slug: (0, slugify_1.default)(name, { lower: true, strict: true }),
                    description,
                    price,
                    mrp: mrpVal ? Number(mrpVal) : undefined,
                    stock: Number(stockVal) || 0,
                    brand,
                    categoryType,
                    shopId: shop.id,
                    status: product_entity_1.ProductStatus.PENDING,
                    images: [],
                    videos: [],
                });
                await this.productRepository.save(product);
                result.created++;
                remaining--;
            }
            catch (err) {
                result.skipped++;
                result.errors.push({ row: rowNum, reason: err.message || 'Failed to create product' });
            }
        }
        return result;
    }
};
exports.BulkUploadService = BulkUploadService;
exports.BulkUploadService = BulkUploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        catalog_service_1.CatalogService])
], BulkUploadService);
//# sourceMappingURL=bulk-upload.service.js.map