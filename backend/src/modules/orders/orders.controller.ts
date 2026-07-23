import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  async createOrder(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  async getMyOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getUserOrders(
      user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
  }

  @Get('seller/all')
  @Roles(UserRole.SELLER)
  async getSellerOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getSellerOrders(
      user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('shopId') shopId?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('shopSearch') shopSearch?: string,
    @Query('customerSearch') customerSearch?: string,
  ) {
    return this.ordersService.getAllOrders(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      {
        status,
        shopId,
        customerId,
        dateFrom,
        dateTo,
        shopSearch,
        customerSearch,
      },
    );
  }

  @Public()
  @Get('track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.trackOrderByNumber(orderNumber);
  }

  @Put('seller/:id/location')
  @Roles(UserRole.SELLER)
  async updateDeliveryLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryLocationDto,
  ) {
    return this.ordersService.updateDeliveryLocation(id, user.id, dto);
  }

  @Put('seller/:id/status')
  @Roles(UserRole.SELLER)
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatusBySeller(
      id,
      user.id,
      updateOrderStatusDto,
    );
  }

  @Put('admin/:id/status')
  @Roles(UserRole.ADMIN)
  async adminUpdateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.adminUpdateOrderStatus(id, updateOrderStatusDto);
  }

  @Get(':id')
  async getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, user.id, user.role, user.shopId);
  }

  @Put(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(id, user.id, reason);
  }

  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post(':id/verify-otp')
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  async verifyDeliveryOtp(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('otp') otp: string,
  ) {
    return this.ordersService.verifyDeliveryOtp(id, otp, user);
  }
}
