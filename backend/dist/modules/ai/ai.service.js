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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const Jimp = __importStar(require("jimp"));
const Tesseract = __importStar(require("tesseract.js"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
let AiService = AiService_1 = class AiService {
    productRepo;
    shopRepo;
    whatsappService;
    logger = new common_1.Logger(AiService_1.name);
    constructor(productRepo, shopRepo, whatsappService) {
        this.productRepo = productRepo;
        this.shopRepo = shopRepo;
        this.whatsappService = whatsappService;
    }
    async processProductImages(files) {
        const extractedTexts = [];
        for (const file of files) {
            try {
                const image = await Jimp.read(file.buffer);
                const processedBuffer = await image
                    .resize(1400, Jimp.AUTO)
                    .greyscale()
                    .contrast(0.6)
                    .brightness(0.05)
                    .normalize()
                    .getBufferAsync(Jimp.MIME_JPEG);
                const { data: { text, confidence } } = await Tesseract.recognize(processedBuffer, 'eng+tel+hin', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            this.logger.debug(`OCR: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                });
                if (text?.trim())
                    extractedTexts.push(text);
            }
            catch (err) {
                this.logger.error(`Image processing failed: ${err.message}`);
            }
        }
        const combinedText = extractedTexts.join('\n');
        return this.parseProductInfo(combinedText);
    }
    parseProductInfo(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const full = text.toLowerCase();
        let suggestedName = 'Unknown Product';
        for (const line of lines) {
            if (line.length > 3 && line.length < 80 && /[a-zA-Z\u0C00-\u0C7F]/.test(line)) {
                suggestedName = line.replace(/[^a-zA-Z0-9\u0C00-\u0C7F\s\-&().]/g, '').trim();
                if (suggestedName.length > 3)
                    break;
            }
        }
        const pricePatterns = [
            /(?:mrp|price|rate|cost)[:\s]*(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i,
            /(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i,
            /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs)/i,
        ];
        let suggestedPrice = null;
        for (const pattern of pricePatterns) {
            const m = text.match(pattern);
            if (m) {
                suggestedPrice = parseFloat(m[1]);
                break;
            }
        }
        const unitMatch = text.match(/(\d+(?:\.\d+)?\s*(?:gm?|kg|ml|l(?:itre)?|pcs?|pieces?|pack|packet|nos?|units?))/i);
        const suggestedUnit = unitMatch ? unitMatch[1].trim() : null;
        const CATEGORY_KEYWORDS = {
            groceries: ['rice', 'flour', 'oil', 'dal', 'sugar', 'salt', 'spice', 'masala', 'atta', 'milk', 'bread'],
            electronics: ['mobile', 'phone', 'charger', 'cable', 'earphone', 'battery', 'adapter', 'usb', 'led'],
            fashion: ['shirt', 'pant', 'saree', 'dress', 'kurta', 'dupatta', 'lehenga', 'jeans', 'top'],
            beauty: ['cream', 'lotion', 'shampoo', 'soap', 'face wash', 'moisturizer', 'serum', 'lipstick'],
            home_essentials: ['bulb', 'wire', 'brush', 'bucket', 'mop', 'broom', 'container', 'jar', 'plate'],
            accessories: ['watch', 'bag', 'wallet', 'belt', 'cap', 'glasses', 'sunglasses'],
        };
        let suggestedCategory = null;
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(kw => full.includes(kw))) {
                suggestedCategory = cat;
                break;
            }
        }
        const suggestedDescription = this.generateDescription(suggestedName, suggestedPrice, suggestedUnit, suggestedCategory, lines);
        const confidence = [
            suggestedName !== 'Unknown Product',
            suggestedPrice !== null,
            suggestedUnit !== null,
            suggestedCategory !== null,
        ].filter(Boolean).length * 25;
        return {
            suggestedName: suggestedName.substring(0, 100),
            suggestedPrice,
            suggestedUnit,
            suggestedDescription,
            suggestedCategory,
            confidence,
            rawText: text.substring(0, 500),
        };
    }
    generateDescription(name, price, unit, category, lines) {
        const parts = [];
        const catLabels = {
            groceries: 'Fresh grocery product',
            electronics: 'Quality electronics product',
            fashion: 'Trendy fashion item',
            beauty: 'Premium beauty product',
            home_essentials: 'Essential home product',
            accessories: 'Stylish accessory',
        };
        const base = catLabels[category ?? ''] ?? 'Quality product';
        parts.push(`${base} — ${name}.`);
        if (unit)
            parts.push(`Available in ${unit} pack.`);
        if (price)
            parts.push(`Best price at ₹${price}.`);
        const extras = lines
            .filter(l => l.length > 10 && l.length < 120)
            .filter(l => !/(?:₹|mrp|rs\.|price|barcode|batch|mfg|exp)/i.test(l))
            .slice(1, 3);
        if (extras.length)
            parts.push(extras.join(' '));
        parts.push('Sold by a trusted local shop on LocalKart.');
        return parts.join(' ').substring(0, 400);
    }
    async checkLowStock() {
        this.logger.log('📦 Checking low-stock products...');
        const LOW_STOCK_THRESHOLD = 5;
        const lowStockProducts = await this.productRepo.find({
            where: {
                status: product_entity_1.ProductStatus.ACTIVE,
                stock: (0, typeorm_2.LessThanOrEqual)(LOW_STOCK_THRESHOLD),
            },
            relations: ['shop', 'shop.owner'],
        });
        const byShop = new Map();
        for (const product of lowStockProducts) {
            if (!product.shop)
                continue;
            if (!byShop.has(product.shopId)) {
                byShop.set(product.shopId, { shop: product.shop, products: [] });
            }
            byShop.get(product.shopId).products.push({
                productId: product.id,
                productName: product.name,
                stock: product.stock,
                threshold: LOW_STOCK_THRESHOLD,
            });
        }
        for (const [, { shop, products }] of byShop) {
            if (!shop.contactPhone)
                continue;
            const outOfStock = products.filter(p => p.stock === 0);
            const lowStock = products.filter(p => p.stock > 0);
            await this.sendLowStockWhatsApp(shop, outOfStock, lowStock);
        }
        this.logger.log(`✅ Low-stock alerts sent to ${byShop.size} shops`);
    }
    async sendLowStockWhatsApp(shop, outOfStock, lowStock) {
        const lines = [
            `📦 *LocalKart — Stock Alert*`,
            ``,
            `Shop: *${shop.name}*`,
            ``,
        ];
        if (outOfStock.length) {
            lines.push(`🔴 *Out of Stock (${outOfStock.length}):*`);
            outOfStock.slice(0, 5).forEach(p => lines.push(`  • ${p.productName}`));
            if (outOfStock.length > 5)
                lines.push(`  ...and ${outOfStock.length - 5} more`);
            lines.push('');
        }
        if (lowStock.length) {
            lines.push(`🟡 *Low Stock (${lowStock.length}):*`);
            lowStock.slice(0, 5).forEach(p => lines.push(`  • ${p.productName} — only *${p.stock} left*`));
            if (lowStock.length > 5)
                lines.push(`  ...and ${lowStock.length - 5} more`);
            lines.push('');
        }
        lines.push(`Update stock in LocalKart Seller app → Products`);
        await this.whatsappService['send'](shop.contactPhone, lines.join('\n'))
            .catch((e) => this.logger.error(`Stock alert WA failed for ${shop.name}: ${e.message}`));
    }
    async manualStockCheck() {
        await this.checkLowStock();
        return { shopsAlerted: 1 };
    }
    async removeBackground(imageBuffer) {
        try {
            const { removeBackground } = await Promise.resolve().then(() => __importStar(require('@imgly/background-removal-node')));
            const blob = await removeBackground(imageBuffer);
            const arrayBuffer = await blob.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (err) {
            this.logger.error(`Background removal failed: ${err.message}`);
            return imageBuffer;
        }
    }
};
exports.AiService = AiService;
__decorate([
    (0, schedule_1.Cron)('0 21 * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiService.prototype, "checkLowStock", null);
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        whatsapp_service_1.WhatsappService])
], AiService);
//# sourceMappingURL=ai.service.js.map