import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPendingShops(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [shops, total] = await this.shopRepository.findAndCount({
      where: { status: ShopStatus.PENDING },
      relations: ['owner'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    shops.forEach(s => delete s.owner?.password);
    return {
      data: shops,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllShops(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [shops, total] = await this.shopRepository.findAndCount({
      where,
      relations: ['owner'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    shops.forEach(s => delete s.owner?.password);
    return {
      data: shops,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveShop(id: string) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.status = ShopStatus.APPROVED;
    await this.shopRepository.save(shop);

    await this.notificationsService.sendSellerNotification(
      shop.ownerId,
      'Shop Approved',
      'Congratulations! Your shop has been approved and is now live on LocalKart.',
    );

    return shop;
  }

  async rejectShop(id: string, reason: string) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.status = ShopStatus.REJECTED;
    await this.shopRepository.save(shop);

    await this.notificationsService.sendSellerNotification(
      shop.ownerId,
      'Shop Rejected',
      `Your shop registration was rejected. Reason: ${reason}`,
    );

    return shop;
  }

  async suspendShop(id: string, reason: string) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.status = ShopStatus.SUSPENDED;
    await this.shopRepository.save(shop);

    await this.notificationsService.sendSellerNotification(
      shop.ownerId,
      'Shop Suspended',
      `Your shop has been suspended. Reason: ${reason}`,
    );

    return shop;
  }

  async getPendingProducts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [products, total] = await this.productRepository.findAndCount({
      where: { status: ProductStatus.PENDING },
      relations: ['shop'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveProduct(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.APPROVED;
    await this.productRepository.save(product);

    // Increment shop product count
    await this.shopRepository.increment({ id: product.shopId }, 'totalProducts', 1);

    await this.notificationsService.sendSellerNotification(
      product.shop.ownerId,
      'Product Approved',
      `Your product "${product.name}" has been approved.`,
    );

    return product;
  }

  async rejectProduct(id: string, reason: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.REJECTED;
    product.rejectionReason = reason;
    await this.productRepository.save(product);

    await this.notificationsService.sendSellerNotification(
      product.shop.ownerId,
      'Product Rejected',
      `Your product "${product.name}" was rejected. Reason: ${reason}`,
    );

    return product;
  }
}
