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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../core/entities/product.entity");
let SearchService = class SearchService {
    productRepository;
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async searchProducts(query, userLat, userLng) {
        const qb = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.status = :status', { status: product_entity_1.ProductStatus.APPROVED })
            .andWhere('shop.status = :shopStatus', { shopStatus: 'approved' });
        if (query) {
            qb.andWhere(`(product.name ILIKE :query OR product.description ILIKE :query OR product.brand ILIKE :query)`, { query: `%${query}%` });
        }
        if (userLat && userLng) {
            qb.addSelect(`ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326)::geography
        )`, 'distance');
            qb.setParameters({ userLng, userLat });
            qb.orderBy('distance', 'ASC');
        }
        else {
            qb.orderBy('product.createdAt', 'DESC');
        }
        const products = await qb.take(50).getMany();
        return products.map((p) => ({
            ...p,
            distance: p.distance ? Math.round(p.distance) : null,
        }));
    }
    async getSponsoredProducts(userLat, userLng) {
        const qb = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .where('product.isSponsored = :isSponsored', { isSponsored: true })
            .andWhere('product.status = :status', { status: product_entity_1.ProductStatus.APPROVED })
            .andWhere('product.sponsoredUntil > :now', { now: new Date() });
        if (userLat && userLng) {
            qb.addSelect(`ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326)::geography
        )`, 'distance');
            qb.setParameters({ userLng, userLat });
            qb.orderBy('distance', 'ASC');
        }
        else {
            qb.orderBy('product.sponsoredUntil', 'DESC');
        }
        return qb.take(10).getMany();
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SearchService);
//# sourceMappingURL=search.service.js.map