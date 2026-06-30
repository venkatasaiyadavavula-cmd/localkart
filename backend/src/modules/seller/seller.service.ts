import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { ShopProfileDto } from './dto/shop-profile.dto';
import { getSignedUploadUrl, BUCKET_NAME } from '../../config/storage.config';

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
    return shop;
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

    const slug = slugify(shopProfileDto.name, { lower: true, strict: true });
    const existingSlug = await this.shopRepository.findOne({ where: { slug } });
    if (existingSlug) {
      throw new BadRequestException('Shop name already taken');
    }

    const shop = this.shopRepository.create({
      ...shopProfileDto,
      slug,
      ownerId,
      status: ShopStatus.PENDING,
      location: `ST_SetSRID(ST_MakePoint(${shopProfileDto.longitude}, ${shopProfileDto.latitude}), 4326)` as any,
    });

    await this.shopRepository.save(shop);

    // Update user role to seller if not already
    if (user.role !== 'seller') {
      user.role = 'seller' as any;
      await this.userRepository.save(user);
    }

    return shop;
  }

  async updateShop(ownerId: string, shopProfileDto: ShopProfileDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shopProfileDto.name) {
      shop.slug = slugify(shopProfileDto.name, { lower: true, strict: true });
    }

    if (shopProfileDto.latitude && shopProfileDto.longitude) {
      (shop as any).location = `ST_SetSRID(ST_MakePoint(${shopProfileDto.longitude}, ${shopProfileDto.latitude}), 4326)`;
    }

    Object.assign(shop, shopProfileDto);
    shop.status = ShopStatus.PENDING; // Require re-approval after significant changes

    await this.shopRepository.save(shop);
    return shop;
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

    const totalOrders = await this.orderRepository.count({
      where: { shopId: shop.id },
    });

    const pendingOrders = await this.orderRepository.count({
      where: { shopId: shop.id, status: OrderStatus.CONFIRMED },
    });

    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('DATE(order.createdAt) = CURRENT_DATE')
      .getCount();

    const recentOrders = await this.orderRepository.find({
      where: { shopId: shop.id },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue?.total || 0,
      todayOrders,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        customerName: o.customer.name,
        createdAt: o.createdAt,
      })),
    };
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

    return sales;
  }
}
