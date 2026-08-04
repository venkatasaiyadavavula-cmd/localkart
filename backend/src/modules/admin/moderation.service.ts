import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Shop, ShopStatus, ManualOverride } from '../../core/entities/shop.entity';
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

  async getPendingShops(page: number, limit: number, search?: string) {
    return this.getAllShops(page, limit, ShopStatus.PENDING, search);
  }

  async getAllShops(page: number, limit: number, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const qb = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .orderBy('shop.createdAt', status === ShopStatus.PENDING ? 'ASC' : 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      qb.andWhere('shop.status = :status', { status });
    }

    const term = search?.trim();
    if (term) {
      const q = `%${term}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('shop.name ILIKE :q', { q })
            .orWhere('owner.phone ILIKE :q', { q });
        }),
      );
    }

    const [shops, total] = await qb.getManyAndCount();

    shops.forEach((s) => delete s.owner?.password);
    return {
      data: shops,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
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
    shop.manualOverride = ManualOverride.NONE;
    shop.manualOverrideSetAt = null;
    await this.shopRepository.save(shop);

    await this.notificationsService.sendSellerNotification(
      shop.ownerId,
      'Shop Approved',
      'Congratulations! Your shop has been approved and is now live on LocalKart.',
    );

    delete shop.owner?.password;
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

    delete shop.owner?.password;
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

    delete shop.owner?.password;
    return shop;
  }

  async unsuspendShop(id: string) {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.status !== ShopStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended shops can be unsuspended');
    }

    shop.status = ShopStatus.APPROVED;
    await this.shopRepository.save(shop);

    await this.notificationsService.sendSellerNotification(
      shop.ownerId,
      'Shop Restored',
      'Your shop has been reactivated and is live on LocalKart again.',
    );

    delete shop.owner?.password;
    return shop;
  }

  async getPendingProducts(page: number, limit: number, search?: string) {
    return this.getAllProducts(page, limit, ProductStatus.PENDING, search);
  }

  async getAllProducts(page: number, limit: number, status: string = 'all', search?: string) {
    const skip = (page - 1) * limit;
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .orderBy('product.createdAt', status === ProductStatus.PENDING ? 'ASC' : 'DESC')
      .skip(skip)
      .take(limit);

    if (status && status !== 'all') {
      const validStatuses = Object.values(ProductStatus);
      if (!validStatuses.includes(status as ProductStatus)) {
        throw new BadRequestException(`Invalid product status: ${status}`);
      }
      qb.andWhere('product.status = :status', { status });
    }

    const term = search?.trim();
    if (term) {
      const q = `%${term}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('product.name ILIKE :q', { q }).orWhere('product.sku ILIKE :q', { q });
        }),
      );
    }

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
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
