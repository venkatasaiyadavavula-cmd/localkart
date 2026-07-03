import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { FeaturedVideo, FeaturedVideoStatus } from '../../core/entities/featured-video.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { FEATURED_VIDEO_HOURS, FEATURED_VIDEO_PRICE } from './ad-packages';

@Injectable()
export class FeaturedVideoService {
  private readonly logger = new Logger(FeaturedVideoService.name);

  constructor(
    @InjectRepository(FeaturedVideo)
    private readonly featuredRepo: Repository<FeaturedVideo>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
  ) {}

  @Cron('0 * * * *')
  async expireOldFeaturedVideos() {
    const now = new Date();
    const result = await this.featuredRepo.update(
      { status: FeaturedVideoStatus.ACTIVE, expiresAt: LessThan(now) },
      { status: FeaturedVideoStatus.EXPIRED },
    );
    if (result.affected) {
      this.logger.log(`Expired ${result.affected} featured videos`);
    }
  }

  async promoteVideo(ownerId: string, productId: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const product = await this.productRepo.findOne({
      where: { id: productId, shopId: shop.id, status: ProductStatus.APPROVED },
    });
    if (!product) throw new NotFoundException('Product not found or not approved');

    const videoUrl = product.videos?.[0];
    if (!videoUrl) throw new BadRequestException('Product has no video. Upload a video first (₹10).');

    const existing = await this.featuredRepo.findOne({
      where: { productId, status: FeaturedVideoStatus.ACTIVE },
    });
    if (existing && existing.expiresAt > new Date()) {
      throw new BadRequestException('This video is already featured on homepage. Wait until it expires.');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + FEATURED_VIDEO_HOURS);

    const featured = this.featuredRepo.create({
      shopId: shop.id,
      productId: product.id,
      videoUrl,
      amount: FEATURED_VIDEO_PRICE,
      status: FeaturedVideoStatus.ACTIVE,
      expiresAt,
    });

    await this.featuredRepo.save(featured);

    return {
      ...featured,
      message: `Video featured on homepage for 24 hours. Charged ₹${FEATURED_VIDEO_PRICE}.`,
      hoursRemaining: FEATURED_VIDEO_HOURS,
    };
  }

  async getSellerFeaturedVideos(ownerId: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    return this.featuredRepo.find({
      where: { shopId: shop.id },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getActiveFeaturedVideos(limit = 12) {
    await this.expireOldFeaturedVideos();

    return this.featuredRepo.find({
      where: {
        status: FeaturedVideoStatus.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['product', 'shop', 'product.shop'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
