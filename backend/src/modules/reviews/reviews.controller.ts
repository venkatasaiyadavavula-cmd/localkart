import {
  Controller, Get, Post, Put, Body,
  Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async createReview(
    @CurrentUser() user: any,
    @Body() dto: { productId: string; orderId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Public()
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.reviewsService.getProductReviews(productId, page, limit);
  }

  @Get('can-review')
  async canReview(
    @CurrentUser() user: any,
    @Query('productId') productId: string,
  ) {
    return this.reviewsService.canReview(user.id, productId);
  }

  @Put(':id/helpful')
  async markHelpful(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.markHelpful(id, user.id);
  }
}
