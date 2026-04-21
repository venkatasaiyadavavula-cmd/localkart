import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SellerService } from './seller.service';
import { SubscriptionService } from './subscription.service';
import { EarningsService } from './earnings.service';
import { AdCampaignService } from './ad-campaign.service';
import { ShopProfileDto } from './dto/shop-profile.dto';
import { SubscribeDto } from './dto/subscription-plan.dto';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/ad-campaign.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class SellerController {
  constructor(
    private readonly sellerService: SellerService,
    private readonly subscriptionService: SubscriptionService,
    private readonly earningsService: EarningsService,
    private readonly adCampaignService: AdCampaignService,
  ) {}

  // Shop Profile
  @Get('shop')
  async getMyShop(@CurrentUser() user: any) {
    return this.sellerService.getShopByOwner(user.id);
  }

  @Post('shop')
  async createShop(@CurrentUser() user: any, @Body() shopProfileDto: ShopProfileDto) {
    return this.sellerService.createShop(user.id, shopProfileDto);
  }

  @Put('shop')
  async updateShop(@CurrentUser() user: any, @Body() shopProfileDto: ShopProfileDto) {
    return this.sellerService.updateShop(user.id, shopProfileDto);
  }

  @Post('shop/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopLogo(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.sellerService.uploadShopLogo(user.id, file);
  }

  @Post('shop/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopBanner(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.sellerService.uploadShopBanner(user.id, file);
  }

  // Dashboard Analytics
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    return this.sellerService.getDashboardStats(user.id);
  }

  @Get('dashboard/sales-chart')
  async getSalesChart(@CurrentUser() user: any, @Query('period') period: string = 'week') {
    return this.sellerService.getSalesChart(user.id, period);
  }

  // Subscription Management
  @Get('subscription')
  async getCurrentSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.getCurrentSubscription(user.id);
  }

  @Get('subscription/plans')
  async getAvailablePlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @Post('subscription/subscribe')
  async subscribe(@CurrentUser() user: any, @Body() subscribeDto: SubscribeDto) {
    return this.subscriptionService.subscribe(user.id, subscribeDto);
  }

  @Post('subscription/cancel')
  async cancelSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.cancelSubscription(user.id);
  }

  @Get('subscription/history')
  async getSubscriptionHistory(@CurrentUser() user: any) {
    return this.subscriptionService.getSubscriptionHistory(user.id);
  }

  // Earnings
  @Get('earnings')
  async getEarnings(@CurrentUser() user: any, @Query('period') period?: string) {
    return this.earningsService.getEarningsSummary(user.id, period);
  }

  @Get('earnings/transactions')
  async getEarningsTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.earningsService.getTransactions(
      user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('earnings/payouts')
  async getPayouts(@CurrentUser() user: any) {
    return this.earningsService.getPayouts(user.id);
  }

  // Ad Campaigns
  @Get('ads')
  async getAdCampaigns(@CurrentUser() user: any) {
    return this.adCampaignService.getCampaigns(user.id);
  }

  @Post('ads')
  async createAdCampaign(@CurrentUser() user: any, @Body() dto: CreateAdCampaignDto) {
    return this.adCampaignService.createCampaign(user.id, dto);
  }

  @Put('ads/:id')
  async updateAdCampaign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAdCampaignDto,
  ) {
    return this.adCampaignService.updateCampaign(user.id, id, dto);
  }

  @Post('ads/:id/pause')
  async pauseAdCampaign(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adCampaignService.pauseCampaign(user.id, id);
  }

  @Post('ads/:id/resume')
  async resumeAdCampaign(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adCampaignService.resumeCampaign(user.id, id);
  }

  @Get('ads/:id/stats')
  async getAdStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adCampaignService.getCampaignStats(user.id, id);
  }
}
