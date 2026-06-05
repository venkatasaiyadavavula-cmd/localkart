import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Shop]),
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AiController],
  providers:   [AiService],
  exports:     [AiService],
})
export class AiModule {}
