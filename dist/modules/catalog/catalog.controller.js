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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const catalog_service_1 = require("./catalog.service");
const search_service_1 = require("./search.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const search_query_dto_1 = require("./dto/search-query.dto");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const daily_offer_entity_1 = require("../../core/entities/daily-offer.entity");
let CatalogController = class CatalogController {
    catalogService;
    searchService;
    productRepository;
    offerRepository;
    constructor(catalogService, searchService, productRepository, offerRepository) {
        this.catalogService = catalogService;
        this.searchService = searchService;
        this.productRepository = productRepository;
        this.offerRepository = offerRepository;
    }
    async getProducts(query) {
        return this.catalogService.getProducts(query);
    }
    async getProductBySlug(slug) {
        return this.catalogService.getProductBySlug(slug);
    }
    async getCategories() {
        return this.catalogService.getCategories();
    }
    async getCategoryBySlug(slug) {
        return this.catalogService.getCategoryBySlug(slug);
    }
    async search(q, lat, lng) {
        return this.searchService.searchProducts(q, lat ? parseFloat(lat) : undefined, lng ? parseFloat(lng) : undefined);
    }
    async getShopProducts(shopId, query) {
        return this.catalogService.getShopProducts(shopId, query);
    }
    async getTodayOffers(lat, lng) {
        const now = new Date();
        const query = this.productRepository
            .createQueryBuilder('product')
            .innerJoin('daily_offers', 'offer', 'offer.productId = product.id')
            .leftJoinAndSelect('product.shop', 'shop')
            .where('offer.isActive = :isActive', { isActive: true })
            .andWhere('offer.expiresAt > :now', { now })
            .andWhere('product.status = :status', { status: 'approved' });
        if (lat && lng) {
            query
                .addSelect(`ST_Distance(shop.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`, 'distance')
                .setParameters({ lng, lat })
                .orderBy('distance', 'ASC');
        }
        else {
            query.orderBy('offer.createdAt', 'DESC');
        }
        query.limit(30);
        const products = await query.getMany();
        for (const product of products) {
            const offer = await this.offerRepository.findOne({
                where: { productId: product.id, isActive: true, expiresAt: (0, typeorm_2.MoreThan)(now) },
            });
            product.daily_offer = offer;
        }
        return { data: products };
    }
    async createProduct(user, createProductDto) {
        return this.catalogService.createProduct(user.id, createProductDto);
    }
    async updateProduct(user, id, updateProductDto) {
        return this.catalogService.updateProduct(user.id, id, updateProductDto);
    }
    async deleteProduct(user, id) {
        await this.catalogService.deleteProduct(user.id, id);
    }
    async getSellerProducts(user, query) {
        return this.catalogService.getSellerProducts(user.id, query);
    }
    async approveProduct(id) {
        return this.catalogService.approveProduct(id);
    }
    async rejectProduct(id, reason) {
        return this.catalogService.rejectProduct(id, reason);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProductBySlug", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCategoryBySlug", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('shop/:shopId/products'),
    __param(0, (0, common_1.Param)('shopId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getShopProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('today-offers'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getTodayOffers", null);
__decorate([
    (0, common_1.Post)('seller/products'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('seller/products/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('seller/products/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('seller/products'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getSellerProducts", null);
__decorate([
    (0, common_1.Put)('admin/products/:id/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "approveProduct", null);
__decorate([
    (0, common_1.Put)('admin/products/:id/reject'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "rejectProduct", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(daily_offer_entity_1.DailyOffer)),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService,
        search_service_1.SearchService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map