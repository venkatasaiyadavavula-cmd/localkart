import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaProcessor } from './media.processor';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { Subscription } from '../../core/entities/subscription.entity';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'media' }),
    TypeOrmModule.forFeature([Shop, Product, Subscription]),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaProcessor],
  exports: [MediaService],
})
export class MediaModule {}
