import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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

  @Get(':id')
  async getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, user.id, user.role);
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

  @Post(':id/verify-otp')
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  async verifyDeliveryOtp(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('otp') otp: string,
  ) {
    return this.ordersService.verifyDeliveryOtp(id, otp, user);
  }

  // Seller endpoints
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

  // Admin endpoints
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ordersService.getAllOrders(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
      shopId,
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

  // Public endpoint for tracking (no auth required)
  @Public()
  @Get('track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.trackOrderByNumber(orderNumber);
  }
}
