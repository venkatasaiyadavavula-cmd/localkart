import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, FindOptionsWhere } from 'typeorm';
import slugify from 'slugify';
import { Product, ProductStatus, ProductCategoryType } from '../../core/entities/product.entity';
import { Category } from '../../core/entities/category.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:  40,
  [SubscriptionPlan.GROWTH]:   150,
  [SubscriptionPlan.BUSINESS]: 500,
};

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async getProducts(query: SearchQueryDto) {
    const {
      page = 1,
      limit = 20,
      categoryType,
      categoryId,
      shopId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product> = {
      status: ProductStatus.APPROVED,
    };

    if (categoryType) where.categoryType = categoryType;
    if (categoryId) where.categoryId = categoryId;
    if (shopId) where.shopId = shopId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = Between(minPrice || 0, maxPrice || Number.MAX_SAFE_INTEGER);
    }
    if ((query as any).query) {
      where.name = ILike(`%${(query as any).query}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: ['shop', 'category'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug, status: ProductStatus.APPROVED },
      relations: ['shop', 'category'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // Increment view count
    product.viewCount += 1;
    await this.productRepository.save(product);
    return product;
  }

  async getCategories() {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return categories;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
      relations: ['children', 'parent'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async getShopProducts(shopId: string, query: SearchQueryDto) {
    const shop = await this.shopRepository.findOne({
      where: { id: shopId, status: ShopStatus.APPROVED },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return this.getProducts({ ...query, shopId });
  }

  // Seller methods
  async createProduct(userId: string, createProductDto: CreateProductDto) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId: userId, status: ShopStatus.APPROVED },
    });
    if (!shop) {
      throw new ForbiddenException('You need an approved shop to add products');
    }

    // Check product limit based on active subscription plan
    const currentProductCount = await this.productRepository.count({
      where: { shopId: shop.id },
    });

    const subscription = await this.subscriptionRepository.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });
    const plan  = subscription?.plan ?? SubscriptionPlan.STARTER;
    const limit = PLAN_LIMITS[plan];

    if (currentProductCount >= limit) {
      throw new ForbiddenException(
        `Product limit reached (${currentProductCount}/${limit}) on your ${plan} plan. ` +
        `Upgrade to add more products.`,
      );
    }

    const slug = slugify(createProductDto.name, { lower: true, strict: true });

    const existingProduct = await this.productRepository.findOne({
      where: { slug, shopId: shop.id },
    });
    if (existingProduct) {
      throw new BadRequestException('Product with this name already exists');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      slug,
      shopId: shop.id,
      status: ProductStatus.PENDING, // Requires admin approval
    });

    await this.productRepository.save(product);
    return product;
  }

  async updateProduct(userId: string, productId: string, updateProductDto: UpdateProductDto) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId: userId, status: ShopStatus.APPROVED },
    });
    if (!shop) {
      throw new ForbiddenException('Shop not found or not approved');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, shopId: shop.id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.name) {
      product.slug = slugify(updateProductDto.name, { lower: true, strict: true });
    }

    Object.assign(product, updateProductDto);
    product.status = ProductStatus.PENDING; // Re-approval needed

    await this.productRepository.save(product);
    return product;
  }

  async deleteProduct(userId: string, productId: string) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId: userId },
    });
    if (!shop) {
      throw new ForbiddenException('Shop not found');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, shopId: shop.id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.remove(product);
  }

  async getSellerProducts(userId: string, query: SearchQueryDto) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId: userId },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Product> = { shopId: shop.id };

    if ((query as any).search) {
      where.name = ILike(`%${(query as any).search}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: ['shop', 'category'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSellerProductById(userId: string, productId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: userId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, shopId: shop.id },
      relations: ['shop', 'category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getSellerProductLimit(userId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: userId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const used = await this.productRepository.count({ where: { shopId: shop.id } });
    const subscription = await this.subscriptionRepository.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });
    const plan = subscription?.plan ?? SubscriptionPlan.STARTER;
    const limit = PLAN_LIMITS[plan];

    return {
      plan,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  // Admin methods
  async approveProduct(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.status = ProductStatus.APPROVED;
    product.rejectionReason = null;
    await this.productRepository.save(product);
    return product;
  }

  async rejectProduct(productId: string, reason: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.status = ProductStatus.REJECTED;
    product.rejectionReason = reason;
    await this.productRepository.save(product);
    return product;
  }
}
