import {
  Controller, Get, Post, Put, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { StaffWorkService } from './staff-work.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateProductDto } from '../catalog/dto/create-product.dto';
import { UpdateProductDto } from '../catalog/dto/update-product.dto';
import { SearchQueryDto } from '../catalog/dto/search-query.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from '../orders/dto/update-delivery-location.dto';

@Controller('staff/work')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffWorkController {
  constructor(private readonly staffWorkService: StaffWorkService) {}

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return this.staffWorkService.getProfile(user);
  }

  @Get('products')
  @RequirePermissions('products:read')
  getProducts(@CurrentUser() user: any, @Query() query: SearchQueryDto) {
    return this.staffWorkService.getProducts(user, query);
  }

  @Post('products')
  @RequirePermissions('products:write')
  createProduct(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.staffWorkService.createProduct(user, dto);
  }

  @Put('products/:id')
  @RequirePermissions('products:write', 'inventory:write')
  updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.staffWorkService.updateProduct(user, id, dto);
  }

  @Get('orders')
  @RequirePermissions('orders:read')
  getOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.staffWorkService.getOrders(
      user,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      status,
    );
  }

  @Put('orders/:id/status')
  @RequirePermissions('orders:write')
  updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.staffWorkService.updateOrderStatus(user, id, dto);
  }

  @Put('orders/:id/location')
  @RequirePermissions('orders:write')
  updateDeliveryLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryLocationDto,
  ) {
    return this.staffWorkService.updateDeliveryLocation(user, id, dto);
  }
}
