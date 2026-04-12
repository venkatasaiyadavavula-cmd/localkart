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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly searchService: SearchService,
  ) {}

  // Public endpoints
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

  // Seller endpoints
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

  // Admin endpoints
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
