import {
  Controller, Get, Post, Param, Body,
  UseGuards, Request, Query, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';
import { Shop } from '../../core/entities/shop.entity';
import { assertPaymentsEnabled } from './payments.config';

@Controller('commission')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  private async resolveShopId(user: { id: string; shopId?: string }): Promise<string> {
    if (user.shopId) return user.shopId;
    const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop.id;
  }

  // Seller: get my bills
  @Get('my-bills')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async getMyBills(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    const shopId = await this.resolveShopId(req.user);
    return this.commissionService.getShopBills(shopId, +page, +limit);
  }

  // Seller: initiate payment for a specific bill
  @Post('pay/:billId')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async initiatePayment(@Request() req: any, @Param('billId') billId: string) {
    assertPaymentsEnabled();
    const shopId = await this.resolveShopId(req.user);
    return this.commissionService.createCommissionPaymentOrder(shopId, billId);
  }

  // Seller: verify payment after Razorpay callback
  @Post('verify/:billId')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async verifyPayment(
    @Request() req: any,
    @Param('billId') billId: string,
    @Body() body: {
      razorpayPaymentId: string;
      razorpayOrderId:   string;
      razorpaySignature: string;
    },
  ) {
    assertPaymentsEnabled();
    const shopId = await this.resolveShopId(req.user);
    return this.commissionService.verifyCommissionPayment(
      shopId,
      billId,
      body.razorpayPaymentId,
      body.razorpayOrderId,
      body.razorpaySignature,
    );
  }

  // Admin: overdue shops
  @Get('admin/overdue')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getOverdue() {
    return this.commissionService.getOverdueShops();
  }

  // Admin: manually trigger weekly bill generation (for testing)
  @Post('admin/generate-today')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async generateToday() {
    await this.commissionService.generateWeeklyBills();
    return { success: true, message: 'Weekly commission bills generated for current Sat–Fri week' };
  }
}
