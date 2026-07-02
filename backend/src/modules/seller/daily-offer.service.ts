import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CreateDailyOfferDto } from './dto/daily-offer.dto';

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

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
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

  async createOffer(ownerId: string, dto: CreateDailyOfferDto) {
    const shop = await this.getShop(ownerId);
    const now = new Date();
    const { productId, offerPrice, sellerNotes, offerDetails } = dto;

    const activeCount = await this.offerRepository.count({
      where: {
        shopId: shop.id,
        isActive: true,
        expiresAt: MoreThan(now),
      },
    });

    if (activeCount >= MAX_ACTIVE_OFFERS) {
      throw new BadRequestException(`Maximum ${MAX_ACTIVE_OFFERS} active offers allowed at a time`);
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, shopId: shop.id, status: ProductStatus.APPROVED },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not approved');
    }

    const activeOnProduct = await this.offerRepository.findOne({
      where: {
        productId: product.id,
        isActive: true,
        expiresAt: MoreThan(now),
      },
    });

    if (activeOnProduct) {
      throw new BadRequestException(
        'This product already has an active daily offer. Remove it or wait until it expires.',
      );
    }

    const offerToday = await this.offerRepository.findOne({
      where: {
        productId: product.id,
        shopId: shop.id,
        createdAt: MoreThanOrEqual(this.startOfToday()),
      },
    });

    if (offerToday) {
      throw new BadRequestException('Only one daily offer per product is allowed each day');
    }

    if (offerPrice >= Number(product.price)) {
      throw new BadRequestException('Offer price must be less than product price');
    }

    const offerStock = offerDetails?.offerStock;
    if (offerStock != null && Number(offerStock) > product.stock) {
      throw new BadRequestException(
        `Offer quantity (${offerStock}) cannot exceed available stock (${product.stock})`,
      );
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
      sellerNotes: sellerNotes?.trim() || null,
      offerDetails: offerDetails || null,
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
