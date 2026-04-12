import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { NearbyShopsDto } from './dto/nearby-shops.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async findNearbyShops(query: NearbyShopsDto) {
    const {
      latitude,
      longitude,
      radius = 5,
      categoryType,
      limit = 20,
      page = 1,
    } = query;

    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const skip = (page - 1) * limit;

    // Using PostGIS ST_DWithin for efficient geospatial query
    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.status = :status', { status: ShopStatus.APPROVED })
      .andWhere(
        `ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius * 1000
        )`,
        { longitude, latitude, radius },
      )
      .leftJoinAndSelect('shop.products', 'product', 'product.status = :productStatus', {
        productStatus: 'approved',
      });

    if (categoryType) {
      queryBuilder.andWhere('product.categoryType = :categoryType', { categoryType });
    }

    // Calculate distance for each shop
    queryBuilder.addSelect(
      `ST_Distance(
        shop.location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`,
      'distance',
    );

    queryBuilder.orderBy('distance', 'ASC');
    queryBuilder.setParameters({ longitude, latitude, radius });

    const [shops, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform shops to include distance
    const shopsWithDistance = shops.map((shop: any) => ({
      ...shop,
      distance: shop.distance ? Math.round(shop.distance) : null, // distance in meters
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

  async searchShopsByName(
    latitude: number,
    longitude: number,
    radius: number,
    query: string,
  ) {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.status = :status', { status: ShopStatus.APPROVED })
      .andWhere(
        `ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius * 1000
        )`,
        { longitude, latitude, radius },
      );

    if (query) {
      queryBuilder.andWhere('(shop.name ILIKE :query OR shop.description ILIKE :query)', {
        query: `%${query}%`,
      });
    }

    queryBuilder.addSelect(
      `ST_Distance(
        shop.location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`,
      'distance',
    );

    queryBuilder.orderBy('distance', 'ASC');
    queryBuilder.setParameters({ longitude, latitude, radius });

    const shops = await queryBuilder.limit(20).getMany();

    return shops.map((shop: any) => ({
      ...shop,
      distance: shop.distance ? Math.round(shop.distance) : null,
    }));
  }

  async getAvailableCities() {
    const result = await this.shopRepository
      .createQueryBuilder('shop')
      .select('DISTINCT shop.city', 'city')
      .where('shop.status = :status', { status: ShopStatus.APPROVED })
      .orderBy('city', 'ASC')
      .getRawMany();

    return result.map((r) => r.city);
  }

  async getPincodesByCity(city: string) {
    const result = await this.shopRepository
      .createQueryBuilder('shop')
      .select('DISTINCT shop.pincode', 'pincode')
      .where('shop.city = :city', { city })
      .andWhere('shop.status = :status', { status: ShopStatus.APPROVED })
      .orderBy('pincode', 'ASC')
      .getRawMany();

    return result.map((r) => r.pincode);
  }

  // Helper method to update shop location coordinates
  async updateShopLocation(shopId: string, latitude: number, longitude: number) {
    await this.shopRepository
      .createQueryBuilder()
      .update(Shop)
      .set({
        latitude,
        longitude,
        location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
      })
      .where('id = :id', { id: shopId })
      .execute();
  }
}
