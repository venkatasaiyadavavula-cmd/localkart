import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';

const MAX_ACTIVE_OFFERS = 5;
const OFFER_DURATION_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DailyOfferService {
  constructor(
    @InjectRepository(DailyOffer)
    private readonly offerRepository: Repository<DailyOffer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  private async getShop(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async getActiveOffers(ownerId: string) {
    const shop = await this.getShop(ownerId);
    const now = new Date();

    return this.offerRepository.find({
      where: {
        shopId: shop.id,
        isActive: true,
        expiresAt: MoreThan(now),
      },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOffer(ownerId: string, productId: string, offerPrice: number) {
    const shop = await this.getShop(ownerId);

    const activeCount = await this.offerRepository.count({
      where: {
        shopId: shop.id,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeCount >= MAX_ACTIVE_OFFERS) {
      throw new BadRequestException(`Maximum ${MAX_ACTIVE_OFFERS} active offers allowed`);
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, shopId: shop.id, status: ProductStatus.APPROVED },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not approved');
    }

    if (offerPrice >= Number(product.price)) {
      throw new BadRequestException('Offer price must be less than product price');
    }

    const originalPrice = Number(product.price);
    const discountPercentage = Math.round(
      ((originalPrice - offerPrice) / originalPrice) * 100,
    );

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + OFFER_DURATION_MS);

    const offer = this.offerRepository.create({
      shopId: shop.id,
      productId: product.id,
      offerPrice,
      originalPrice,
      discountPercentage,
      startsAt,
      expiresAt,
      isActive: true,
    });

    await this.offerRepository.save(offer);

    return this.offerRepository.findOne({
      where: { id: offer.id },
      relations: ['product'],
    });
  }

  async deleteOffer(ownerId: string, offerId: string) {
    const shop = await this.getShop(ownerId);
    const offer = await this.offerRepository.findOne({
      where: { id: offerId, shopId: shop.id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    offer.isActive = false;
    await this.offerRepository.save(offer);
    return { message: 'Offer removed successfully' };
  }
}
