import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { BulkUploadService } from './bulk-upload.service';
import { Product } from '../../core/entities/product.entity';
import { Category } from '../../core/entities/category.entity';
import { Shop } from '../../core/entities/shop.entity';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { FeaturedVideoModule } from '../seller/featured-video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Shop, DailyOffer, Subscription]),
    FeaturedVideoModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService, SearchService, BulkUploadService],
  exports: [CatalogService],
})
export class CatalogModule {}
