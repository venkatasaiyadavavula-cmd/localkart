"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const seller_controller_1 = require("./seller.controller");
const seller_service_1 = require("./seller.service");
const subscription_service_1 = require("./subscription.service");
const earnings_service_1 = require("./earnings.service");
const ad_campaign_service_1 = require("./ad-campaign.service");
const weekly_earnings_scheduler_1 = require("./weekly-earnings.scheduler");
const staff_service_1 = require("./staff.service");
const staff_controller_1 = require("./staff.controller");
const daily_offer_service_1 = require("./daily-offer.service");
const featured_video_module_1 = require("./featured-video.module");
const daily_offer_entity_1 = require("../../core/entities/daily-offer.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
const sponsored_product_entity_1 = require("../../core/entities/sponsored-product.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const commission_bill_entity_1 = require("../../core/entities/commission-bill.entity");
const staff_member_entity_1 = require("../../core/entities/staff-member.entity");
const catalog_module_1 = require("../catalog/catalog.module");
const orders_module_1 = require("../orders/orders.module");
const staff_work_controller_1 = require("./staff-work.controller");
const staff_work_service_1 = require("./staff-work.service");
const permissions_guard_1 = require("../../core/guards/permissions.guard");
const notifications_module_1 = require("../notifications/notifications.module");
let SellerModule = class SellerModule {
};
exports.SellerModule = SellerModule;
exports.SellerModule = SellerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                shop_entity_1.Shop, user_entity_1.User, product_entity_1.Product, order_entity_1.Order,
                subscription_entity_1.Subscription, sponsored_product_entity_1.SponsoredProduct, transaction_entity_1.Transaction,
                commission_bill_entity_1.CommissionBill, staff_member_entity_1.StaffMember, daily_offer_entity_1.DailyOffer,
            ]),
            bull_1.BullModule.registerQueue({ name: 'media' }),
            notifications_module_1.NotificationsModule,
            (0, common_1.forwardRef)(() => catalog_module_1.CatalogModule),
            featured_video_module_1.FeaturedVideoModule,
            orders_module_1.OrdersModule,
            schedule_1.ScheduleModule.forRoot(),
            jwt_1.JwtModule.registerAsync({
                useFactory: (cfg) => ({
                    secret: cfg.get('JWT_SECRET'),
                    signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN') || '7d' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [seller_controller_1.SellerController, staff_controller_1.StaffController, staff_work_controller_1.StaffWorkController],
        providers: [
            seller_service_1.SellerService, subscription_service_1.SubscriptionService, earnings_service_1.EarningsService,
            ad_campaign_service_1.AdCampaignService, weekly_earnings_scheduler_1.WeeklyEarningsScheduler, staff_service_1.StaffService,
            daily_offer_service_1.DailyOfferService, staff_work_service_1.StaffWorkService, permissions_guard_1.PermissionsGuard,
        ],
        exports: [
            seller_service_1.SellerService, subscription_service_1.SubscriptionService, earnings_service_1.EarningsService,
            ad_campaign_service_1.AdCampaignService, weekly_earnings_scheduler_1.WeeklyEarningsScheduler, staff_service_1.StaffService,
            daily_offer_service_1.DailyOfferService, featured_video_module_1.FeaturedVideoModule,
        ],
    })
], SellerModule);
//# sourceMappingURL=seller.module.js.map