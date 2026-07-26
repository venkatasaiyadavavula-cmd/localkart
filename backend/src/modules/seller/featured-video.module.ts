import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedVideo } from '../../core/entities/featured-video.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { AdCampaignCharge } from '../../core/entities/ad-campaign-charge.entity';
import { FeaturedVideoService } from './featured-video.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeaturedVideo, Product, Shop, AdCampaignCharge])],
  providers: [FeaturedVideoService],
  exports: [FeaturedVideoService],
})
export class FeaturedVideoModule {}
