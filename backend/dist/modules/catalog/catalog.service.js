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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const slugify_1 = __importDefault(require("slugify"));
const product_entity_1 = require("../../core/entities/product.entity");
const category_entity_1 = require("../../core/entities/category.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
let CatalogService = class CatalogService {
    productRepository;
    categoryRepository;
    shopRepository;
    constructor(productRepository, categoryRepository, shopRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.shopRepository = shopRepository;
    }
    async getProducts(query) {
        const { page = 1, limit = 20, categoryType, categoryId, shopId, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'DESC', } = query;
        const skip = (page - 1) * limit;
        const where = {
            status: product_entity_1.ProductStatus.APPROVED,
        };
        if (categoryType)
            where.categoryType = categoryType;
        if (categoryId)
            where.categoryId = categoryId;
        if (shopId)
            where.shopId = shopId;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = (0, typeorm_2.Between)(minPrice || 0, maxPrice || Number.MAX_SAFE_INTEGER);
        }
        const [products, total] = await this.productRepository.findAndCount({
            where,
            relations: ['shop', 'category'],
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });
        return {
            data: products,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getProductBySlug(slug) {
        const product = await this.productRepository.findOne({
            where: { slug, status: product_entity_1.ProductStatus.APPROVED },
            relations: ['shop', 'category'],
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        product.viewCount += 1;
        await this.productRepository.save(product);
        return product;
    }
    async getCategories() {
        const categories = await this.categoryRepository.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
        });
        return categories;
    }
    async getCategoryBySlug(slug) {
        const category = await this.categoryRepository.findOne({
            where: { slug, isActive: true },
            relations: ['children', 'parent'],
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async getShopProducts(shopId, query) {
        const shop = await this.shopRepository.findOne({
            where: { id: shopId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.getProducts({ ...query, shopId });
    }
    async createProduct(userId, createProductDto) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId: userId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop) {
            throw new common_1.ForbiddenException('You need an approved shop to add products');
        }
        const currentProductCount = await this.productRepository.count({
            where: { shopId: shop.id },
        });
        const slug = (0, slugify_1.default)(createProductDto.name, { lower: true, strict: true });
        const existingProduct = await this.productRepository.findOne({
            where: { slug, shopId: shop.id },
        });
        if (existingProduct) {
            throw new common_1.BadRequestException('Product with this name already exists');
        }
        const product = this.productRepository.create({
            ...createProductDto,
            slug,
            shopId: shop.id,
            status: product_entity_1.ProductStatus.PENDING,
        });
        await this.productRepository.save(product);
        return product;
    }
    async updateProduct(userId, productId, updateProductDto) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId: userId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop) {
            throw new common_1.ForbiddenException('Shop not found or not approved');
        }
        const product = await this.productRepository.findOne({
            where: { id: productId, shopId: shop.id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (updateProductDto.name) {
            product.slug = (0, slugify_1.default)(updateProductDto.name, { lower: true, strict: true });
        }
        Object.assign(product, updateProductDto);
        product.status = product_entity_1.ProductStatus.PENDING;
        await this.productRepository.save(product);
        return product;
    }
    async deleteProduct(userId, productId) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId: userId },
        });
        if (!shop) {
            throw new common_1.ForbiddenException('Shop not found');
        }
        const product = await this.productRepository.findOne({
            where: { id: productId, shopId: shop.id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        await this.productRepository.remove(product);
    }
    async getSellerProducts(userId, query) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId: userId },
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.getProducts({ ...query, shopId: shop.id });
    }
    async approveProduct(productId) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        product.status = product_entity_1.ProductStatus.APPROVED;
        product.rejectionReason = null;
        await this.productRepository.save(product);
        return product;
    }
    async rejectProduct(productId, reason) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        product.status = product_entity_1.ProductStatus.REJECTED;
        product.rejectionReason = reason;
        await this.productRepository.save(product);
        return product;
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map