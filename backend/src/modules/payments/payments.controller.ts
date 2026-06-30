import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @Roles(UserRole.CUSTOMER)
  async createRazorpayOrder(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createRazorpayOrder(user.id, createPaymentDto);
  }

  @Post('verify')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: any,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    const isValid = await this.paymentsService.verifyPayment(
      user.id,
      verifyPaymentDto,
    );
    if (!isValid) {
      throw new BadRequestException('Payment verification failed');
    }
    return { success: true, message: 'Payment verified successfully' };
  }

  @Post('cod/initiate')
  @Roles(UserRole.CUSTOMER)
  async initiateCodOrder(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.initiateCodOrder(user.id, createPaymentDto);
  }
}
