import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  async activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  // Seller can view their own shop profile
  @Get('shop/my')
  @Roles(UserRole.SELLER)
  async getMyShop(@CurrentUser() user: any) {
    return this.usersService.getShopByOwnerId(user.id);
  }
}

  // ── Saved Addresses ───────────────────────────────────────
  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  async getAddresses(@Request() req: any) {
    const user = await this.usersService.getProfile(req.user.id);
    return user.savedAddresses ?? [];
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  async addAddress(@Request() req: any, @Body() body: any) {
    const user = await this.usersService.getProfile(req.user.id);
    const addresses = user.savedAddresses ?? [];
    const newAddr = { ...body, id: require('crypto').randomUUID(), isDefault: addresses.length === 0 };
    await this.usersService.updateAddresses(req.user.id, [...addresses, newAddr]);
    return newAddr;
  }

  @Patch('addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  async setDefaultAddress(@Request() req: any, @Param('id') id: string) {
    const user = await this.usersService.getProfile(req.user.id);
    const updated = (user.savedAddresses ?? []).map((a: any) => ({ ...a, isDefault: a.id === id }));
    await this.usersService.updateAddresses(req.user.id, updated);
    return { success: true };
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAddress(@Request() req: any, @Param('id') id: string) {
    const user = await this.usersService.getProfile(req.user.id);
    const updated = (user.savedAddresses ?? []).filter((a: any) => a.id !== id);
    await this.usersService.updateAddresses(req.user.id, updated);
    return { success: true };
  }

  // ── Wishlist ──────────────────────────────────────────────
  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  async getWishlist(@Request() req: any) {
    return this.usersService.getWishlist(req.user.id);
  }

  @Post('wishlist/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleWishlist(@Request() req: any, @Body('productId') productId: string) {
    return this.usersService.toggleWishlist(req.user.id, productId);
  }
