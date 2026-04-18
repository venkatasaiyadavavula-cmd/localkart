import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { UserRole } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { DailyOffer } from '../../core/entities/daily-offer.entity';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly searchService: SearchService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(DailyOffer)
    private offerRepository: Repository<DailyOffer>,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get('products')
  async getProducts(@Query() query: SearchQueryDto) {
    return this.catalogService.getProducts(query);
  }

  @Public()
  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Public()
  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Public()
  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }

  @Public()
  @Get('search')
  async search(@Query('q') q: string, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.searchService.searchProducts(
      q,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
    );
  }

  @Public()
  @Get('shop/:shopId/products')
  async getShopProducts(@Param('shopId') shopId: string, @Query() query: SearchQueryDto) {
    return this.catalogService.getShopProducts(shopId, query);
  }

  @Public()
  @Get('today-offers')
  async getTodayOffers(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const now = new Date();
    const query = this.productRepository
      .createQueryBuilder('product')
      .innerJoin('daily_offers', 'offer', 'offer.productId = product.id')
      .leftJoinAndSelect('product.shop', 'shop')
      .where('offer.isActive = :isActive', { isActive: true })
      .andWhere('offer.expiresAt > :now', { now })
      .andWhere('product.status = :status', { status: 'approved' });

    if (lat && lng) {
      query
        .addSelect(
          `ST_Distance(shop.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
          'distance',
        )
        .setParameters({ lng, lat })
        .orderBy('distance', 'ASC');
    } else {
      query.orderBy('offer.createdAt', 'DESC');
    }

    query.limit(30);
    const products = await query.getMany();

    // Attach offer details to each product
    for (const product of products) {
      const offer = await this.offerRepository.findOne({
        where: { productId: product.id, isActive: true, expiresAt: MoreThan(now) },
      });
      (product as any).daily_offer = offer;
    }

    return { data: products };
  }

  // ==================== SELLER ENDPOINTS ====================

  @Post('seller/products')
  @Roles(UserRole.SELLER)
  async createProduct(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    return this.catalogService.createProduct(user.id, createProductDto);
  }

  @Put('seller/products/:id')
  @Roles(UserRole.SELLER)
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(user.id, id, updateProductDto);
  }

  @Delete('seller/products/:id')
  @Roles(UserRole.SELLER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    await this.catalogService.deleteProduct(user.id, id);
  }

  @Get('seller/products')
  @Roles(UserRole.SELLER)
  async getSellerProducts(@CurrentUser() user: any, @Query() query: SearchQueryDto) {
    return this.catalogService.getSellerProducts(user.id, query);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Put('admin/products/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveProduct(@Param('id') id: string) {
    return this.catalogService.approveProduct(id);
  }

  @Put('admin/products/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectProduct(@Param('id') id: string, @Body('reason') reason: string) {
    return this.catalogService.rejectProduct(id, reason);
  }
}
