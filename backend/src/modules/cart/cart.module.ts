import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Shop]),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
