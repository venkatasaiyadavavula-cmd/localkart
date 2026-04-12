import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Shop])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
