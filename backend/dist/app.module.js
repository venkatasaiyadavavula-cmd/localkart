"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const jwt_1 = require("@nestjs/jwt");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const database_config_1 = __importDefault(require("./config/database.config"));
const redis_config_1 = __importDefault(require("./config/redis.config"));
const user_entity_1 = require("./core/entities/user.entity");
const shop_entity_1 = require("./core/entities/shop.entity");
const product_entity_1 = require("./core/entities/product.entity");
const category_entity_1 = require("./core/entities/category.entity");
const order_entity_1 = require("./core/entities/order.entity");
const order_item_entity_1 = require("./core/entities/order-item.entity");
const subscription_entity_1 = require("./core/entities/subscription.entity");
const transaction_entity_1 = require("./core/entities/transaction.entity");
const return_request_entity_1 = require("./core/entities/return-request.entity");
const sponsored_product_entity_1 = require("./core/entities/sponsored-product.entity");
const daily_offer_entity_1 = require("./core/entities/daily-offer.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const location_module_1 = require("./modules/location/location.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const cart_module_1 = require("./modules/cart/cart.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const seller_module_1 = require("./modules/seller/seller.module");
const media_module_1 = require("./modules/media/media.module");
const returns_module_1 = require("./modules/returns/returns.module");
const admin_module_1 = require("./modules/admin/admin.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const ai_module_1 = require("./modules/ai/ai.module");
const offer_cleanup_service_1 = require("./modules/seller/offer-cleanup.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 30,
                },
            ]),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, redis_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    entities: [
                        user_entity_1.User,
                        shop_entity_1.Shop,
                        product_entity_1.Product,
                        category_entity_1.Category,
                        order_entity_1.Order,
                        order_item_entity_1.OrderItem,
                        subscription_entity_1.Subscription,
                        transaction_entity_1.Transaction,
                        return_request_entity_1.ReturnRequest,
                        sponsored_product_entity_1.SponsoredProduct,
                        daily_offer_entity_1.DailyOffer,
                    ],
                    synchronize: configService.get('NODE_ENV') === 'development',
                    logging: configService.get('NODE_ENV') === 'development',
                    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    redis: {
                        host: configService.get('redis.host'),
                        port: configService.get('redis.port'),
                        password: configService.get('redis.password') || undefined,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
                    },
                }),
                inject: [config_1.ConfigService],
                global: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            location_module_1.LocationModule,
            catalog_module_1.CatalogModule,
            cart_module_1.CartModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            seller_module_1.SellerModule,
            media_module_1.MediaModule,
            returns_module_1.ReturnsModule,
            admin_module_1.AdminModule,
            notifications_module_1.NotificationsModule,
            ai_module_1.AiModule,
        ],
        providers: [offer_cleanup_service_1.OfferCleanupService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map