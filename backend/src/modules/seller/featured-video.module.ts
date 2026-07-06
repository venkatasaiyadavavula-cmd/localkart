import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedVideo } from '../../core/entities/featured-video.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { FeaturedVideoService } from './featured-video.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeaturedVideo, Product, Shop])],
  providers: [FeaturedVideoService],
  exports: [FeaturedVideoService],
})
export class FeaturedVideoModule {}
