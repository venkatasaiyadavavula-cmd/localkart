import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, FindOptionsWhere, Not, IsNull } from 'typeorm';
import slugify from 'slugify';
import { Product, ProductStatus, ProductCategoryType } from '../../core/entities/product.entity';
import { Category } from '../../core/entities/category.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { enrichProductsWithShopHours, enrichProductWithShopHours } from '../../core/utils/shop-hours.util';
import { productUpdateRequiresReapproval } from './product-reapproval.util';
import { ProductVariantService } from './product-variant.service';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:  40,
  [SubscriptionPlan.GROWTH]:   150,
  [SubscriptionPlan.BUSINESS]: 500,
};

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly productVariantService: ProductVariantService,
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
      sponsored,
      hasVideo,
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
    if (query.query) {
      where.name = ILike(`%${query.query}%`);
    }
    if (sponsored) {
      where.isSponsored = true;
    }
    if (hasVideo) {
      where.videos = Not(IsNull());
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: ['shop', 'category'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: enrichProductsWithShopHours(products),
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
    return enrichProductWithShopHours(product);
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
    const shop = await this.shopRepository.findOne({ where: { ownerId: userId } });
    if (!shop) {
      throw new ForbiddenException('Please complete shop onboarding before adding products');
    }
    if (shop.status !== ShopStatus.APPROVED) {
      throw new ForbiddenException(
        'Your shop must be approved by admin before you can add products',
      );
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

    const duplicateName = await this.productRepository.findOne({
      where: { shopId: shop.id, name: createProductDto.name },
    });
    if (duplicateName) {
      throw new BadRequestException('You already have a product with this name');
    }

    const slug = await this.allocateUniqueProductSlug(createProductDto.name);

    const { variants, ...createFields } = createProductDto;

    const product = this.productRepository.create({
      ...createFields,
      slug,
      shopId: shop.id,
      status: ProductStatus.PENDING, // Requires admin approval
    });

    try {
      await this.productRepository.save(product);
    } catch (err: unknown) {
      this.logger.error(
        `createProduct save failed for shop ${shop.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (isUniqueViolation(err)) {
        throw new BadRequestException(
          'A product with a similar name already exists on LocalKart. Try a more specific name.',
        );
      }
      throw err;
    }

    if (variants?.length) {
      await this.productVariantService.replaceVariantsForProduct(product.id, variants);
    }

    return this.getSellerProductById(userId, product.id);
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

    const { variants, ...updateFields } = updateProductDto;

    if (updateFields.name) {
      product.slug = await this.allocateUniqueProductSlug(
        updateFields.name,
        product.id,
      );
    }

    const requiresReapproval = productUpdateRequiresReapproval(updateFields, product);

    Object.assign(product, updateFields);
    if (requiresReapproval) {
      product.status = ProductStatus.PENDING; // Re-approval needed
    }

    await this.productRepository.save(product);

    if (variants !== undefined) {
      if (variants.length === 0) {
        await this.productVariantService.clearVariantsForProduct(product.id);
      } else {
        await this.productVariantService.replaceVariantsForProduct(product.id, variants);
      }
    }

    return this.getSellerProductById(userId, productId);
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

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    } else if (query.query) {
      where.name = ILike(`%${query.query}%`);
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

    const variants = await this.productVariantService.listByProductId(product.id);
    return { ...product, variants };
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

  /** Allocate a globally unique product URL slug (used by bulk upload). */
  async allocateProductSlug(name: string, excludeProductId?: string): Promise<string> {
    return this.allocateUniqueProductSlug(name, excludeProductId);
  }

  /**
   * Product slugs are globally unique (URL path /browse/.../product/[slug]).
   * When another shop already uses the base slug, append -2, -3, …
   */
  private async allocateUniqueProductSlug(
    name: string,
    excludeProductId?: string,
  ): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing = await this.productRepository.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeProductId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}
