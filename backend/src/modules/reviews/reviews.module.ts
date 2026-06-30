import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from '../../core/entities/review.entity';
import { Order } from '../../core/entities/order.entity';
import { Product } from '../../core/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Order, Product])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
