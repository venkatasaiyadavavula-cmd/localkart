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
import { AdCampaignService } from '../seller/ad-campaign.service';
import { ReadThrottle } from '../../core/decorators/read-throttle.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly moderationService: ModerationService,
    private readonly commissionService: CommissionService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly adCampaignService: AdCampaignService,
  ) {}

  // Dashboard
  @ReadThrottle()
  @Get('dashboard')
  async getDashboardStats(@Query('period') period?: string) {
    return this.adminService.getDashboardStats(period);
  }

  @ReadThrottle()
  @Get('dashboard/revenue-chart')
  async getRevenueChart(@Query('period') period: string = 'month') {
    return this.adminService.getRevenueChart(period);
  }

  @ReadThrottle()
  @Get('customers')
  async listCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const activeFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.adminService.listCustomers({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      search,
      isActive: activeFilter,
      dateFrom,
      dateTo,
    });
  }

  // Shop Moderation
  @ReadThrottle()
  @Get('shops/pending')
  async getPendingShops(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getPendingShops(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      search,
    );
  }

  @ReadThrottle()
  @Get('shops')
  async getAllShops(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getAllShops(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
      search,
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

  @Put('shops/:id/unsuspend')
  async unsuspendShop(@Param('id') id: string) {
    return this.moderationService.unsuspendShop(id);
  }

  // Product Moderation
  @ReadThrottle()
  @Get('products')
  async getAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getAllProducts(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status || 'all',
      search,
    );
  }

  @ReadThrottle()
  @Get('products/pending')
  async getPendingProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getPendingProducts(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      search,
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

  // Commission rate configuration (weekly bills live under /commission/admin/*)
  @ReadThrottle()
  @Get('commissions/rates')
  async getCategoryCommissionRates() {
    return this.commissionService.getCategoryCommissionRates();
  }

  @Put('commissions/category/:categoryType')
  async updateCategoryCommission(
    @Param('categoryType') categoryType: string,
    @Body('rate') rate: number,
  ) {
    return this.commissionService.updateCategoryCommission(categoryType, rate);
  }

  // Fraud Detection
  @ReadThrottle()
  @Get('fraud/suspicious-orders')
  async getSuspiciousOrders() {
    return this.fraudDetectionService.getSuspiciousOrders();
  }

  @ReadThrottle()
  @Get('fraud/user/:userId/activity')
  async getUserActivity(@Param('userId') userId: string) {
    return this.fraudDetectionService.getUserActivity(userId);
  }

  @Post('fraud/blacklist/:userId')
  async blacklistUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.fraudDetectionService.blacklistUser(userId, reason);
  }

  @ReadThrottle()
  @Get('fraud/cod-risk/:orderId')
  async assessCodRisk(@Param('orderId') orderId: string) {
    return this.fraudDetectionService.assessCodRisk(orderId);
  }

  @ReadThrottle()
  @Get('ad-campaigns')
  async listAdCampaigns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adCampaignService.listCampaignsForAdmin(
      parseInt(page || '1', 10),
      parseInt(limit || '30', 10),
    );
  }

  @Post('ad-campaigns/:id/pause')
  @HttpCode(HttpStatus.OK)
  async pauseAdCampaign(@Param('id') id: string) {
    return this.adCampaignService.pauseCampaignAsAdmin(id);
  }

  @Post('ad-campaigns/:id/resume')
  @HttpCode(HttpStatus.OK)
  async resumeAdCampaign(@Param('id') id: string) {
    return this.adCampaignService.resumeCampaignAsAdmin(id);
  }
}
