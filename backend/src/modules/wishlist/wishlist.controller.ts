import {
  Controller, Get, Post, Delete,
  Param, UseGuards, Body,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  async toggle(
    @CurrentUser() user: any,
    @Body('productId') productId: string,
  ) {
    return this.wishlistService.toggle(user.id, productId);
  }

  @Get()
  async getWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Get('ids')
  async getWishlistIds(@CurrentUser() user: any) {
    return this.wishlistService.getWishlistProductIds(user.id);
  }
}
