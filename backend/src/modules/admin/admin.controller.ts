import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ModerationService } from './moderation.service';
import { CommissionService } from './commission.service';
import { FraudDetectionService } from './fraud-detection.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly moderationService: ModerationService,
    private readonly commissionService: CommissionService,
    private readonly fraudDetectionService: FraudDetectionService,
  ) {}

  // Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/revenue-chart')
  async getRevenueChart(@Query('period') period: string = 'month') {
    return this.adminService.getRevenueChart(period);
  }

  // Shop Moderation
  @Get('shops/pending')
  async getPendingShops(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.moderationService.getPendingShops(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('shops')
  async getAllShops(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.moderationService.getAllShops(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
  }

  @Put('shops/:id/approve')
  async approveShop(@Param('id') id: string) {
    return this.moderationService.approveShop(id);
  }

  @Put('shops/:id/reject')
  async rejectShop(@Param('id') id: string, @Body('reason') reason: string) {
    return this.moderationService.rejectShop(id, reason);
  }

  @Put('shops/:id/suspend')
  async suspendShop(@Param('id') id: string, @Body('reason') reason: string) {
    return this.moderationService.suspendShop(id, reason);
  }

  // Product Moderation
  @Get('products/pending')
  async getPendingProducts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.moderationService.getPendingProducts(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Put('products/:id/approve')
  async approveProduct(@Param('id') id: string) {
    return this.moderationService.approveProduct(id);
  }

  @Put('products/:id/reject')
  async rejectProduct(@Param('id') id: string, @Body('reason') reason: string) {
    return this.moderationService.rejectProduct(id, reason);
  }

  // Commission Management
  @Get('commissions/summary')
  async getCommissionSummary(@Query('period') period?: string) {
    return this.commissionService.getCommissionSummary(period);
  }

  @Get('commissions/transactions')
  async getCommissionTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionService.getCommissionTransactions(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Put('commissions/category/:categoryType')
  async updateCategoryCommission(
    @Param('categoryType') categoryType: string,
    @Body('rate') rate: number,
  ) {
    return this.commissionService.updateCategoryCommission(categoryType, rate);
  }

  @Post('commissions/settle/:shopId')
  async settleShopEarnings(@Param('shopId') shopId: string) {
    return this.commissionService.settleShopEarnings(shopId);
  }

  // Fraud Detection
  @Get('fraud/suspicious-orders')
  async getSuspiciousOrders() {
    return this.fraudDetectionService.getSuspiciousOrders();
  }

  @Get('fraud/user/:userId/activity')
  async getUserActivity(@Param('userId') userId: string) {
    return this.fraudDetectionService.getUserActivity(userId);
  }

  @Post('fraud/blacklist/:userId')
  async blacklistUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.fraudDetectionService.blacklistUser(userId, reason);
  }

  @Get('fraud/cod-risk/:orderId')
  async assessCodRisk(@Param('orderId') orderId: string) {
    return this.fraudDetectionService.assessCodRisk(orderId);
  }
}
