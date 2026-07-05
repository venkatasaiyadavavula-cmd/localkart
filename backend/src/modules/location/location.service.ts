import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { NearbyShopsDto } from './dto/nearby-shops.dto';
import { enrichShopWithHoursStatus } from '../../core/utils/shop-hours.util';
import {
  MAX_DELIVERY_RADIUS_KM,
  calculateDeliveryCharge,
  haversineDistanceKm,
} from './delivery-pricing';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  /**
   * దగ్గరలోని షాపులను వాటి దూరంతో సహా తిరిగి ఇస్తుంది
   */
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
    throw new BadRequestException(
      'Latitude and longitude are required',
    );
  }

  const skip = (page - 1) * limit;

  const queryBuilder = this.shopRepository
    .createQueryBuilder('shop')
    .where('shop.status = :status', {
      status: ShopStatus.APPROVED,
    })
    .andWhere(
      `ST_DWithin(
        shop.location,
        ST_SetSRID(
          ST_MakePoint(:longitude, :latitude),
          4326
        )::geography,
        :radius * 1000
      )`,
      {
        longitude,
        latitude,
        radius,
      },
    )
    .leftJoinAndSelect(
      'shop.products',
      'product',
      'product.status = :productStatus',
      {
        productStatus: 'approved',
      },
    );

  if (categoryType) {
    queryBuilder.andWhere(
      'product.categoryType = :categoryType',
      { categoryType },
    );
  }

  queryBuilder.addSelect(
    `ST_Distance(
      shop.location,
      ST_SetSRID(
        ST_MakePoint(:longitude, :latitude),
        4326
      )::geography
    )`,
    'distance',
  );

  queryBuilder.orderBy('distance', 'ASC');
  queryBuilder.setParameters({
    longitude,
    latitude,
    radius,
  });

  const { entities, raw } = await queryBuilder
    .skip(skip)
    .take(limit)
    .getRawAndEntities();

  const total = await queryBuilder.getCount();

  console.log('RAW DISTANCES:', raw);

  const shopsWithDistance = entities.map(
    (shop: any, index) =>
      enrichShopWithHoursStatus({
        ...shop,
        distance: raw[index]?.distance
          ? Math.round(Number(raw[index].distance))
          : null,
      }),
  );

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

  /**
   * పేరు ఆధారంగా షాపులను వెతుకుతుంది
   */
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

    return shops.map((shop: any) =>
      enrichShopWithHoursStatus({
        ...shop,
        distance: shop.distance ? Math.round(shop.distance) : null,
      }),
    );
  }

  /**
   * షాపులు ఉన్న నగరాల జాబితాను ఇస్తుంది
   */
  async getAvailableCities() {
    const result = await this.shopRepository
      .createQueryBuilder('shop')
      .select('DISTINCT shop.city', 'city')
      .where('shop.status = :status', { status: ShopStatus.APPROVED })
      .orderBy('city', 'ASC')
      .getRawMany();

    return result.map((r) => r.city);
  }

  /**
   * ఒక నగరంలోని పిన్‌కోడ్‌లను ఇస్తుంది
   */
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

  /**
   * షాపు లొకేషన్ అప్‌డేట్ చేస్తుంది
   */
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

  /**
   * యూజర్ లొకేషన్ కు దగ్గరలో డెలివరీ చేసే షాపులు ఉన్నాయో లేదో చెక్ చేస్తుంది
   * మరియు దగ్గరి షాపు దూరాన్ని (కి.మీ.లలో) కూడా ఇస్తుంది
   */
  async checkServiceability(
    lat: number,
    lng: number,
    radius: number = MAX_DELIVERY_RADIUS_KM,
  ): Promise<{ serviceable: boolean; shopsCount: number; maxDistance?: number; deliveryCharge?: number }> {
    if (!lat || !lng) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const result = await this.shopRepository
      .createQueryBuilder('shop')
      .select('COUNT(*)', 'count')
      .addSelect(
        `MIN(ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ))`,
        'minDistance',
      )
      .where('shop.status = :status', { status: ShopStatus.APPROVED })
      .andWhere(
        `ST_DWithin(
          shop.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius * 1000
        )`,
        { lng, lat, radius },
      )
      .getRawOne();

    const shopsCount = parseInt(result.count, 10);
    const minDistanceMeters = result.minDistance ? parseFloat(result.minDistance) : null;
    const maxDistanceKm = minDistanceMeters ? Math.round((minDistanceMeters / 1000) * 10) / 10 : undefined;
    const deliveryCharge = maxDistanceKm !== undefined ? calculateDeliveryCharge(maxDistanceKm) : undefined;

    return {
      serviceable: shopsCount > 0 && (deliveryCharge === undefined || deliveryCharge >= 0),
      shopsCount,
      maxDistance: maxDistanceKm,
      deliveryCharge: deliveryCharge !== undefined && deliveryCharge >= 0 ? deliveryCharge : undefined,
    };
  }

  /**
   * Shop to customer distance-based delivery charge (used at checkout)
   */
  resolveDeliveryCharge(
    shop: Pick<Shop, 'latitude' | 'longitude' | 'deliveryCharge' | 'freeDeliveryAbove'>,
    customerLat?: number,
    customerLng?: number,
    subtotal?: number,
  ): number {
    if (subtotal !== undefined && shop.freeDeliveryAbove > 0 && subtotal >= shop.freeDeliveryAbove) {
      return 0;
    }

    if (customerLat && customerLng && shop.latitude && shop.longitude) {
      const distanceKm = haversineDistanceKm(
        shop.latitude,
        shop.longitude,
        customerLat,
        customerLng,
      );
      const charge = calculateDeliveryCharge(distanceKm);
      if (charge < 0) {
        throw new BadRequestException(
          `Delivery not available beyond ${MAX_DELIVERY_RADIUS_KM} km from the shop`,
        );
      }
      return charge;
    }

    return shop.deliveryCharge ?? 0;
  }
}
