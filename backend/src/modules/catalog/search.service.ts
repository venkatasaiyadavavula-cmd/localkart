import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchProducts(query: string, userLat?: number, userLng?: number) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.APPROVED })
      .andWhere('shop.status = :shopStatus', { shopStatus: 'approved' });

    if (query) {
      qb.andWhere(
        `(product.name ILIKE :query OR product.description ILIKE :query OR product.brand ILIKE :query)`,
        { query: `%${query}%` },
      );
    }

    // If location provided, sort by distance
    if (userLat && userLng) {
      qb.addSelect(
        `ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326)::geography
        )`,
        'distance',
      );
      qb.setParameters({ userLng, userLat });
      qb.orderBy('distance', 'ASC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }

    const products = await qb.take(50).getMany();
    return products.map((p: any) => ({
      ...p,
      distance: p.distance ? Math.round(p.distance) : null,
    }));
  }

  async getSponsoredProducts(userLat?: number, userLng?: number) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .where('product.isSponsored = :isSponsored', { isSponsored: true })
      .andWhere('product.status = :status', { status: ProductStatus.APPROVED })
      .andWhere('product.sponsoredUntil > :now', { now: new Date() });

    if (userLat && userLng) {
      qb.addSelect(
        `ST_Distance(
          shop.location,
          ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326)::geography
        )`,
        'distance',
      );
      qb.setParameters({ userLng, userLat });
      qb.orderBy('distance', 'ASC');
    } else {
      qb.orderBy('product.sponsoredUntil', 'DESC');
    }

    return qb.take(10).getMany();
  }
}
