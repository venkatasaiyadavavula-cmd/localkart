"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const payments_controller_1 = require("./payments.controller");
const payments_service_1 = require("./payments.service");
const webhook_controller_1 = require("./webhook.controller");
const commission_service_1 = require("./commission.service");
const commission_controller_1 = require("./commission.controller");
const order_entity_1 = require("../../core/entities/order.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const commission_bill_entity_1 = require("../../core/entities/commission-bill.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const orders_module_1 = require("../orders/orders.module");
const notifications_module_1 = require("../notifications/notifications.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([order_entity_1.Order, transaction_entity_1.Transaction, commission_bill_entity_1.CommissionBill, shop_entity_1.Shop]),
            orders_module_1.OrdersModule,
            notifications_module_1.NotificationsModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [payments_controller_1.PaymentsController, webhook_controller_1.WebhookController, commission_controller_1.CommissionController],
        providers: [payments_service_1.PaymentsService, commission_service_1.CommissionService],
        exports: [payments_service_1.PaymentsService, commission_service_1.CommissionService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map