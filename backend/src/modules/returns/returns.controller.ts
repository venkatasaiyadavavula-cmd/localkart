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
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto, UpdateReturnStatusDto } from './dto/return-request.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseInterceptors(FilesInterceptor('evidence', 5))
  async createReturnRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateReturnRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.returnsService.createReturnRequest(user.id, dto, files);
  }

  @Get()
  async getMyReturnRequests(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.returnsService.getUserReturnRequests(
      user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get(':id')
  async getReturnRequestById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.returnsService.getReturnRequestById(id, user.id, user.role);
  }

  @Put(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  async cancelReturnRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.returnsService.cancelReturnRequest(id, user.id);
  }

  // Seller endpoints
  @Get('seller/pending')
  @Roles(UserRole.SELLER)
  async getSellerPendingReturns(@CurrentUser() user: any) {
    return this.returnsService.getSellerPendingReturns(user.id);
  }

  @Put('seller/:id/approve')
  @Roles(UserRole.SELLER)
  async approveReturnRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.returnsService.approveReturnRequest(id, user.id);
  }

  @Put('seller/:id/reject')
  @Roles(UserRole.SELLER)
  async rejectReturnRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.returnsService.rejectReturnRequest(id, user.id, reason);
  }

  @Put('seller/:id/schedule-pickup')
  @Roles(UserRole.SELLER)
  async schedulePickup(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { pickupDate: string; pickupAddress: string; contactPhone: string },
  ) {
    return this.returnsService.schedulePickup(id, user.id, body);
  }

  @Put('seller/:id/confirm-pickup')
  @Roles(UserRole.SELLER)
  async confirmPickup(@CurrentUser() user: any, @Param('id') id: string) {
    return this.returnsService.confirmPickup(id, user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllReturnRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.returnsService.getAllReturnRequests(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
  }

  @Put('admin/:id/status')
  @Roles(UserRole.ADMIN)
  async adminUpdateReturnStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
  ) {
    return this.returnsService.adminUpdateReturnStatus(id, dto);
  }

  @Post('admin/:id/process-refund')
  @Roles(UserRole.ADMIN)
  async processRefund(@Param('id') id: string) {
    return this.returnsService.processRefund(id);
  }
}
