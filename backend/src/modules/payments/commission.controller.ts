import {
  Controller, Get, Post, Param, Body,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('commission')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // Seller: get my bills
  @Get('my-bills')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async getMyBills(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    const shopId = req.user.shopId;
    return this.commissionService.getShopBills(shopId, +page, +limit);
  }

  // Seller: initiate payment for a specific bill
  @Post('pay/:billId')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async initiatePayment(@Request() req: any, @Param('billId') billId: string) {
    return this.commissionService.createCommissionPaymentOrder(req.user.shopId, billId);
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
    return this.commissionService.verifyCommissionPayment(
      req.user.shopId,
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

  // Admin: manually trigger bill generation (for testing)
  @Post('admin/generate-today')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async generateToday() {
    await this.commissionService.generateDailyBills();
    return { success: true, message: 'Bills generated for today' };
  }
}
