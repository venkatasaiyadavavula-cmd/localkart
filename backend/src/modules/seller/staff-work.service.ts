import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { CatalogService } from '../catalog/catalog.service';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from '../catalog/dto/create-product.dto';
import { UpdateProductDto } from '../catalog/dto/update-product.dto';
import { SearchQueryDto } from '../catalog/dto/search-query.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from '../orders/dto/update-delivery-location.dto';

@Injectable()
export class StaffWorkService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @Inject(forwardRef(() => CatalogService))
    private readonly catalogService: CatalogService,
    private readonly ordersService: OrdersService,
  ) {}

  private async resolveOwnerId(shopId: string): Promise<string> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop.ownerId;
  }

  async getProfile(staffUser: any) {
    const shop = await this.shopRepo.findOne({ where: { id: staffUser.shopId } });
    return {
      id: staffUser.id,
      name: staffUser.name,
      staffId: staffUser.staffId,
      staffRole: staffUser.staffRole,
      shopId: staffUser.shopId,
      shopName: shop?.name ?? staffUser.shopName,
      permissions: staffUser.permissions,
    };
  }

  async getProducts(staffUser: any, query: SearchQueryDto) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.catalogService.getSellerProducts(ownerId, query);
  }

  async createProduct(staffUser: any, dto: CreateProductDto) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.catalogService.createProduct(ownerId, dto);
  }

  async updateProduct(staffUser: any, productId: string, dto: UpdateProductDto) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.catalogService.updateProduct(ownerId, productId, dto);
  }

  async getOrders(staffUser: any, page = 1, limit = 20, status?: string) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.ordersService.getSellerOrders(ownerId, page, limit, status);
  }

  async updateOrderStatus(staffUser: any, orderId: string, dto: UpdateOrderStatusDto) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.ordersService.updateOrderStatusBySeller(orderId, ownerId, dto);
  }

  async updateDeliveryLocation(staffUser: any, orderId: string, dto: UpdateDeliveryLocationDto) {
    const ownerId = await this.resolveOwnerId(staffUser.shopId);
    return this.ordersService.updateDeliveryLocation(orderId, ownerId, dto);
  }
}
