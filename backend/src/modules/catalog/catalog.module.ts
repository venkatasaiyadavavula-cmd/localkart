import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { Product } from '../../core/entities/product.entity';
import { Category } from '../../core/entities/category.entity';
import { Shop } from '../../core/entities/shop.entity';
import { DailyOffer } from '../../core/entities/daily-offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Shop, DailyOffer])],
  controllers: [CatalogController],
  providers: [CatalogService, SearchService],
  exports: [CatalogService],
})
export class CatalogModule {}
