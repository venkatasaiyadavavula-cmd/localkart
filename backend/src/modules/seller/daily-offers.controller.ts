import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../../core/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

@Controller('seller/daily-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class DailyOffersController {
  constructor(
    @InjectRepository(DailyOffer)
    private offerRepository: Repository<DailyOffer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
  ) {}

  @Get()
  async getMyOffers(@CurrentUser() user: any) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
    if (!shop) throw new BadRequestException('Shop not found');

    const now = new Date();
    return this.offerRepository.find({
      where: { shopId: shop.id, isActive: true, expiresAt: MoreThan(now) },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  async createOffer(@CurrentUser() user: any, @Body() body: { productId: string; offerPrice: number }) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
    if (!shop) throw new BadRequestException('Shop not found');

    const now = new Date();
    const activeOffers = await this.offerRepository.count({
      where: { shopId: shop.id, isActive: true, expiresAt: MoreThan(now) },
    });
    if (activeOffers >= 5) {
      throw new BadRequestException('You can only have 5 active offers at a time');
    }

    const existingOffer = await this.offerRepository.findOne({
      where: { productId: body.productId, isActive: true, expiresAt: MoreThan(now) },
    });
    if (existingOffer) {
      throw new BadRequestException('This product already has an active offer');
    }

    const product = await this.productRepository.findOne({
      where: { id: body.productId, shopId: shop.id },
    });
    if (!product) throw new BadRequestException('Product not found');
    if (body.offerPrice >= product.price) {
      throw new BadRequestException('Offer price must be less than original price');
    }

    const discountPercentage = Math.round(((product.price - body.offerPrice) / product.price) * 100);
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const offer = this.offerRepository.create({
      shopId: shop.id,
      productId: product.id,
      offerPrice: body.offerPrice,
      originalPrice: product.price,
      discountPercentage,
      startsAt: now,
      expiresAt,
    });

    return this.offerRepository.save(offer);
  }

  @Delete(':id')
  async deleteOffer(@CurrentUser() user: any, @Param('id') id: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
    if (!shop) throw new BadRequestException('Shop not found');

    await this.offerRepository.update(
      { id, shopId: shop.id },
      { isActive: false }
    );
    return { message: 'Offer removed' };
  }
}
