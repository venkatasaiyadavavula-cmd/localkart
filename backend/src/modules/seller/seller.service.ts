import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import slugify from 'slugify';
import { Shop, ShopStatus, ManualOverride } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { ShopProfileDto } from './dto/shop-profile.dto';
import { UpdateShopHoursDto } from './dto/shop-hours.dto';
import { ShopToggleDto } from './dto/shop-toggle.dto';
import { getSignedUploadUrl, BUCKET_NAME } from '../../config/storage.config';
import {
  createDefaultOperatingHours,
  enrichShopWithHoursStatus,
} from '../../core/utils/shop-hours.util';
import type { OperatingHours } from '../../core/types/shop-hours.types';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getShopByOwner(ownerId: string) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException('Shop not found. Please create your shop first.');
    }

    delete shop.owner.password;
    return enrichShopWithHoursStatus(shop);
  }

  async getShopBySlug(slug: string) {
    const shop = await this.shopRepository.findOne({
      where: { slug, status: ShopStatus.APPROVED },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return enrichShopWithHoursStatus(shop);
  }

  async getShopById(id: string) {
    const shop = await this.shopRepository.findOne({
      where: { id, status: ShopStatus.APPROVED },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return enrichShopWithHoursStatus(shop);
  }

  async createShop(ownerId: string, shopProfileDto: ShopProfileDto) {
    const existingShop = await this.shopRepository.findOne({
      where: { ownerId },
    });

    if (existingShop) {
      throw new BadRequestException('You already have a shop');
    }

    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const slug = await this.allocateUniqueSlug(shopProfileDto.name);

    const shop = this.shopRepository.create({
      ...shopProfileDto,
      slug,
      ownerId,
      status: ShopStatus.PENDING,
      operatingHours: createDefaultOperatingHours(),
      manualOverride: ManualOverride.FORCE_CLOSED,
      manualOverrideSetAt: new Date(),
    });

    const savedShop = await this.shopRepository.save(shop);

    if (shopProfileDto.latitude != null && shopProfileDto.longitude != null) {
      await this.setShopLocation(savedShop.id, shopProfileDto.latitude, shopProfileDto.longitude);
    }

    // Update user role to seller if not already
    if (user.role !== 'seller') {
      user.role = 'seller' as any;
      await this.userRepository.save(user);
    }

    return enrichShopWithHoursStatus(savedShop);
  }

  async updateShop(ownerId: string, shopProfileDto: ShopProfileDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shopProfileDto.name) {
      shop.slug = await this.allocateUniqueSlug(shopProfileDto.name, shop.id);
    }

    Object.assign(shop, shopProfileDto);
    shop.status = ShopStatus.PENDING; // Require re-approval after significant changes

    await this.shopRepository.save(shop);

    if (shopProfileDto.latitude != null && shopProfileDto.longitude != null) {
      await this.setShopLocation(shop.id, shopProfileDto.latitude, shopProfileDto.longitude);
    }

    return enrichShopWithHoursStatus(shop);
  }

  async updateOperatingHours(ownerId: string, hoursDto: UpdateShopHoursDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.operatingHours = hoursDto as unknown as OperatingHours;
    // Keep legacy fields in sync with Monday schedule for backward compatibility
    shop.openingTime = hoursDto.monday.open;
    shop.closingTime = hoursDto.monday.close;

    await this.shopRepository.save(shop);
    return enrichShopWithHoursStatus(shop);
  }

  async setManualOverride(ownerId: string, toggleDto: ShopToggleDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    shop.manualOverride = toggleDto.manualOverride;
    shop.manualOverrideSetAt =
      toggleDto.manualOverride === ManualOverride.NONE ? null : new Date();

    await this.shopRepository.save(shop);
    return enrichShopWithHoursStatus(shop);
  }

  async uploadShopLogo(ownerId: string, file: Express.Multer.File) {
    const shop = await this.getShopByOwner(ownerId);
    const key = `shops/${shop.id}/logo-${Date.now()}-${file.originalname}`;
    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    shop.logoImage = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    await this.shopRepository.save(shop);

    return { uploadUrl, key, logoUrl: shop.logoImage };
  }

  async uploadShopBanner(ownerId: string, file: Express.Multer.File) {
    const shop = await this.getShopByOwner(ownerId);
    const key = `shops/${shop.id}/banner-${Date.now()}-${file.originalname}`;
    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    shop.bannerImage = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    await this.shopRepository.save(shop);

    return { uploadUrl, key, bannerUrl: shop.bannerImage };
  }

  async getDashboardStats(ownerId: string) {
    const shop = await this.getShopByOwner(ownerId);

    const totalProducts = await this.productRepository.count({
      where: { shopId: shop.id },
    });

    const activeProducts = await this.productRepository.count({
      where: { shopId: shop.id, status: ProductStatus.APPROVED },
    });

    const lowStockProducts = await this.productRepository.count({
      where: { shopId: shop.id, stock: Between(1, 4) },
    });

    const totalOrders = await this.orderRepository.count({
      where: { shopId: shop.id },
    });

    const pendingOtpOrders = await this.orderRepository.count({
      where: { shopId: shop.id, status: OrderStatus.PENDING_OTP },
    });

    const pendingOrders = await this.orderRepository.count({
      where: { shopId: shop.id, status: OrderStatus.CONFIRMED },
    });

    const productsSold = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .select('COALESCE(SUM(item.quantity), 0)', 'total')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const recentOrders = await this.orderRepository.find({
      where: { shopId: shop.id },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const topProducts = await this.productRepository.find({
      where: { shopId: shop.id, status: ProductStatus.APPROVED },
      order: { orderCount: 'DESC' },
      take: 5,
    });

    return {
      shopName: shop.name,
      isCurrentlyOpen: shop.isCurrentlyOpen,
      statusMessage: shop.statusMessage,
      manualOverride: shop.manualOverride,
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders: pendingOtpOrders + pendingOrders,
      pendingOtpOrders,
      confirmedOrders: pendingOrders,
      productsSold: Number(productsSold?.total || 0),
      totalRevenue: Number(totalRevenue?.total || 0),
      revenueChange: 0,
      ordersChange: 0,
      productsSoldChange: 0,
      activeProductsChange: 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        customer: { name: o.customer?.name },
        createdAt: o.createdAt,
      })),
      topProducts,
    };
  }

  /** Unique URL slug; appends -2, -3, … when the base slug is already taken. */
  private async allocateUniqueSlug(name: string, excludeShopId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing = await this.shopRepository.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeShopId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }
  }

  /** PostGIS geography column — must use raw SQL via query builder, not repository.save(). */
  private async setShopLocation(shopId: string, latitude: number, longitude: number) {
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

  async getSalesChart(ownerId: string, period: string) {
    const shop = await this.getShopByOwner(ownerId);
    let dateFormat: string;
    let interval: string;

    switch (period) {
      case 'week':
        dateFormat = 'Dy';
        interval = '7 days';
        break;
      case 'month':
        dateFormat = 'DD';
        interval = '30 days';
        break;
      case 'year':
        dateFormat = 'Mon';
        interval = '12 months';
        break;
      default:
        dateFormat = 'Dy';
        interval = '7 days';
    }

    const sales = await this.orderRepository
      .createQueryBuilder('order')
      .select(`DATE_TRUNC('day', order.createdAt)`, 'date')
      .addSelect('SUM(order.totalAmount)', 'sales')
      .addSelect('COUNT(*)', 'orders')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere(`order.createdAt >= NOW() - INTERVAL '${interval}'`)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return sales.map((row) => ({
      date: row.date,
      sales: Number(row.sales || 0),
      orders: Number(row.orders || 0),
    }));
  }
}
