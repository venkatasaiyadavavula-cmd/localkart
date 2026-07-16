import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from './core/guards/throttler.guard';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';

import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AddressesModule } from './modules/addresses/addresses.module';

import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

import { User } from './core/entities/user.entity';
import { Shop } from './core/entities/shop.entity';
import { Product } from './core/entities/product.entity';
import { Category } from './core/entities/category.entity';
import { Order } from './core/entities/order.entity';
import { OrderItem } from './core/entities/order-item.entity';
import { Subscription } from './core/entities/subscription.entity';
import { Transaction } from './core/entities/transaction.entity';
import { ReturnRequest } from './core/entities/return-request.entity';
import { SponsoredProduct } from './core/entities/sponsored-product.entity';
import { DailyOffer } from './core/entities/daily-offer.entity';
import { Review } from './core/entities/review.entity';
import { ReviewHelpfulVote } from './core/entities/review-helpful-vote.entity';
import { Wishlist } from './core/entities/wishlist.entity';
import { SavedAddress } from './core/entities/saved-address.entity';
import { StaffMember } from './core/entities/staff-member.entity';
import { CommissionBill } from './core/entities/commission-bill.entity';
import { FeaturedVideo } from './core/entities/featured-video.entity';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LocationModule } from './modules/location/location.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SellerModule } from './modules/seller/seller.module';
import { MediaModule } from './modules/media/media.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';


@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 120 },
      { name: 'auth', ttl: 60000, limit: 10 },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host:     configService.get('database.host'),
        port:     configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          User, Shop, Product, Category, Order, OrderItem,
          Subscription, Transaction, ReturnRequest, SponsoredProduct,
          DailyOffer, Review, ReviewHelpfulVote, Wishlist, SavedAddress, StaffMember, CommissionBill,
          FeaturedVideo,
        ],
        synchronize: false,
        logging: false,
        ssl: configService.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:     configService.get('redis.host'),
          port:     configService.get('redis.port'),
          password: configService.get('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
      global: true,
    }),

    AuthModule,
    UsersModule,
    LocationModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    SellerModule,
    MediaModule,
    ReturnsModule,
    AdminModule,
    NotificationsModule,
    ReviewsModule,
    WishlistModule,
    AddressesModule,

  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
