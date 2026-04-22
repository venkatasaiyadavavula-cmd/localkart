"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const moderation_service_1 = require("./moderation.service");
const commission_service_1 = require("./commission.service");
const fraud_detection_service_1 = require("./fraud-detection.service");
const shop_entity_1 = require("../../core/entities/shop.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const return_request_entity_1 = require("../../core/entities/return-request.entity");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                shop_entity_1.Shop,
                product_entity_1.Product,
                order_entity_1.Order,
                user_entity_1.User,
                transaction_entity_1.Transaction,
                return_request_entity_1.ReturnRequest,
                subscription_entity_1.Subscription,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, moderation_service_1.ModerationService, commission_service_1.CommissionService, fraud_detection_service_1.FraudDetectionService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map