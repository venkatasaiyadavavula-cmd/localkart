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
var BulkUploadService_1;
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
const PLAN_LIMITS = {
    [subscription_entity_1.SubscriptionPlan.STARTER]: 40,
    [subscription_entity_1.SubscriptionPlan.GROWTH]: 150,
    [subscription_entity_1.SubscriptionPlan.BUSINESS]: 500,
};
let BulkUploadService = BulkUploadService_1 = class BulkUploadService {
    productRepo;
    shopRepo;
    subscriptionRepo;
    logger = new common_1.Logger(BulkUploadService_1.name);
    constructor(productRepo, shopRepo, subscriptionRepo) {
        this.productRepo = productRepo;
        this.shopRepo = shopRepo;
        this.subscriptionRepo = subscriptionRepo;
    }
    async getProductLimit(ownerId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const subscription = await this.subscriptionRepo.findOne({
            where: { shopId: shop.id, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
            order: { endDate: 'DESC' },
        });
        const plan = subscription?.plan ?? subscription_entity_1.SubscriptionPlan.STARTER;
        const limit = PLAN_LIMITS[plan];
        const used = await this.productRepo.count({ where: { shopId: shop.id } });
        return { plan, limit, used, remaining: Math.max(0, limit - used) };
    }
    async bulkUploadFromExcel(ownerId, fileBuffer) {
        const shop = await this.shopRepo.findOne({
            where: { ownerId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop)
            throw new common_1.ForbiddenException('Approved shop required');
        const { limit, used } = await this.getProductLimit(ownerId);
        const remaining = limit - used;
        if (remaining <= 0) {
            throw new common_1.ForbiddenException(`Product limit reached (${used}/${limit}). Upgrade your plan to add more products.`);
        }
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!rows.length)
            throw new common_1.BadRequestException('Excel file is empty');
        const result = { total: rows.length, created: 0, skipped: 0, errors: [] };
        let slotUsed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;
            try {
                const name = String(row['name'] ?? row['Name'] ?? row['Product Name'] ?? '').trim();
                const price = parseFloat(row['price'] ?? row['Price'] ?? row['Selling Price'] ?? '0');
                const cat = String(row['category'] ?? row['Category'] ?? '').toLowerCase().trim().replace(/\s+/g, '_');
                if (!name) {
                    result.errors.push({ row: rowNum, reason: 'Name is required' });
                    result.skipped++;
                    continue;
                }
                if (isNaN(price) || price <= 0) {
                    result.errors.push({ row: rowNum, reason: 'Valid price required' });
                    result.skipped++;
                    continue;
                }
                if (!Object.values(product_entity_1.ProductCategoryType).includes(cat)) {
                    result.errors.push({ row: rowNum, reason: `Invalid category "${cat}"` });
                    result.skipped++;
                    continue;
                }
                if (slotUsed >= remaining) {
                    result.errors.push({ row: rowNum, reason: `Plan limit reached (${limit} products). Upgrade to add more.` });
                    result.skipped++;
                    continue;
                }
                let slug = (0, slugify_1.default)(name, { lower: true, strict: true });
                const exists = await this.productRepo.findOne({ where: { slug, shopId: shop.id } });
                if (exists)
                    slug = `${slug}-${Date.now()}`;
                const mrp = parseFloat(row['mrp'] ?? row['MRP'] ?? '0') || undefined;
                const stock = parseInt(row['stock'] ?? row['Stock'] ?? '0') || 0;
                const description = String(row['description'] ?? row['Description'] ?? '').trim() || undefined;
                const brand = String(row['brand'] ?? row['Brand'] ?? '').trim() || undefined;
                const unit = String(row['unit'] ?? row['Unit'] ?? '').trim() || undefined;
                const product = this.productRepo.create({
                    name, slug, price,
                    originalPrice: mrp,
                    stock,
                    description,
                    brand,
                    unit,
                    categoryType: cat,
                    shopId: shop.id,
                    status: product_entity_1.ProductStatus.PENDING,
                });
                await this.productRepo.save(product);
                result.created++;
                slotUsed++;
            }
            catch (err) {
                result.errors.push({ row: rowNum, reason: err.message });
                result.skipped++;
            }
        }
        this.logger.log(`Bulk upload: shop=${shop.name} total=${result.total} created=${result.created} skipped=${result.skipped}`);
        return result;
    }
    generateTemplate() {
        const headers = [
            'name', 'price', 'mrp', 'category', 'stock',
            'description', 'brand', 'unit',
        ];
        const sampleRows = [
            {
                name: 'Toor Dal 1kg', price: 120, mrp: 140,
                category: 'groceries', stock: 50,
                description: 'Premium quality toor dal', brand: 'Local Brand', unit: '1kg',
            },
            {
                name: 'Cotton T-Shirt Blue', price: 299, mrp: 499,
                category: 'fashion', stock: 20,
                description: 'Comfortable cotton t-shirt', brand: '', unit: '',
            },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
        ws['!cols'] = headers.map(h => ({ wch: h === 'description' ? 40 : 18 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        const notesWs = XLSX.utils.aoa_to_sheet([
            ['Field', 'Required', 'Notes'],
            ['name', 'YES', 'Product name (max 200 chars)'],
            ['price', 'YES', 'Selling price in ₹'],
            ['mrp', 'no', 'Original/MRP price in ₹'],
            ['category', 'YES', 'groceries / fashion / electronics / home_essentials / beauty / accessories'],
            ['stock', 'no', 'Stock quantity (default 0)'],
            ['description', 'no', 'Product description'],
            ['brand', 'no', 'Brand name'],
            ['unit', 'no', 'e.g. 1kg, 500ml, pack of 6'],
        ]);
        notesWs['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, notesWs, 'Instructions');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
};
exports.BulkUploadService = BulkUploadService;
exports.BulkUploadService = BulkUploadService = BulkUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BulkUploadService);
//# sourceMappingURL=bulk-upload.service.js.map