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
exports.LocationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../../core/entities/shop.entity");
let LocationService = class LocationService {
    shopRepository;
    constructor(shopRepository) {
        this.shopRepository = shopRepository;
    }
    async findNearbyShops(query) {
        const { latitude, longitude, radius = 5, categoryType, limit = 20, page = 1, } = query;
        if (!latitude || !longitude) {
            throw new common_1.BadRequestException('Latitude and longitude are required');
        }
        const skip = (page - 1) * limit;
        const queryBuilder = this.shopRepository
            .createQueryBuilder('shop')
            .where('shop.status = :status', { status: shop_entity_1.ShopStatus.APPROVED })
            .andWhere(`ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius * 1000
        )`, { longitude, latitude, radius })
            .leftJoinAndSelect('shop.products', 'product', 'product.status = :productStatus', {
            productStatus: 'approved',
        });
        if (categoryType) {
            queryBuilder.andWhere('product.categoryType = :categoryType', { categoryType });
        }
        queryBuilder.addSelect(`ST_Distance(
        shop.location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`, 'distance');
        queryBuilder.orderBy('distance', 'ASC');
        queryBuilder.setParameters({ longitude, latitude, radius });
        const [shops, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const shopsWithDistance = shops.map((shop) => ({
            ...shop,
            distance: shop.distance ? Math.round(shop.distance) : null,
        }));
        return {
            data: shopsWithDistance,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async searchShopsByName(latitude, longitude, radius, query) {
        if (!latitude || !longitude) {
            throw new common_1.BadRequestException('Latitude and longitude are required');
        }
        const queryBuilder = this.shopRepository
            .createQueryBuilder('shop')
            .where('shop.status = :status', { status: shop_entity_1.ShopStatus.APPROVED })
            .andWhere(`ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius * 1000
        )`, { longitude, latitude, radius });
        if (query) {
            queryBuilder.andWhere('(shop.name ILIKE :query OR shop.description ILIKE :query)', {
                query: `%${query}%`,
            });
        }
        queryBuilder.addSelect(`ST_Distance(
        shop.location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`, 'distance');
        queryBuilder.orderBy('distance', 'ASC');
        queryBuilder.setParameters({ longitude, latitude, radius });
        const shops = await queryBuilder.limit(20).getMany();
        return shops.map((shop) => ({
            ...shop,
            distance: shop.distance ? Math.round(shop.distance) : null,
        }));
    }
    async getAvailableCities() {
        const result = await this.shopRepository
            .createQueryBuilder('shop')
            .select('DISTINCT shop.city', 'city')
            .where('shop.status = :status', { status: shop_entity_1.ShopStatus.APPROVED })
            .orderBy('city', 'ASC')
            .getRawMany();
        return result.map((r) => r.city);
    }
    async getPincodesByCity(city) {
        const result = await this.shopRepository
            .createQueryBuilder('shop')
            .select('DISTINCT shop.pincode', 'pincode')
            .where('shop.city = :city', { city })
            .andWhere('shop.status = :status', { status: shop_entity_1.ShopStatus.APPROVED })
            .orderBy('pincode', 'ASC')
            .getRawMany();
        return result.map((r) => r.pincode);
    }
    async updateShopLocation(shopId, latitude, longitude) {
        await this.shopRepository
            .createQueryBuilder()
            .update(shop_entity_1.Shop)
            .set({
            latitude,
            longitude,
            location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
        })
            .where('id = :id', { id: shopId })
            .execute();
    }
    async checkServiceability(lat, lng, radius = 20) {
        if (!lat || !lng) {
            throw new common_1.BadRequestException('Latitude and longitude are required');
        }
        const result = await this.shopRepository
            .createQueryBuilder('shop')
            .select('COUNT(*)', 'count')
            .addSelect(`MIN(ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ))`, 'minDistance')
            .where('shop.status = :status', { status: shop_entity_1.ShopStatus.APPROVED })
            .andWhere(`ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius * 1000
        )`, { lng, lat, radius })
            .getRawOne();
        const shopsCount = parseInt(result.count, 10);
        const minDistanceMeters = result.minDistance ? parseFloat(result.minDistance) : null;
        const maxDistanceKm = minDistanceMeters ? Math.round(minDistanceMeters / 1000) : undefined;
        return {
            serviceable: shopsCount > 0,
            shopsCount,
            maxDistance: maxDistanceKm,
        };
    }
};
exports.LocationService = LocationService;
exports.LocationService = LocationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LocationService);
//# sourceMappingURL=location.service.js.map