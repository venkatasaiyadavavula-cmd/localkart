import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

// Configurations
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Core Entities
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

// Feature Modules
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
// AiModule తీసివేయబడింది
// OfferCleanupService తీసివేయబడింది

@Module({
  imports: [
    // Rate Limiting (Throttler)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute per IP
      },
    ]),

    // Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
    }),

    // Database (PostgreSQL + PostGIS)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          User,
          Shop,
          Product,
          Category,
          Order,
          OrderItem,
          Subscription,
          Transaction,
          ReturnRequest,
          SponsoredProduct,
          DailyOffer,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // JWT Module (Global)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // Feature Modules
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
  ],
})
export class AppModule {}