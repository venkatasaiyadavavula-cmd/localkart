"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const typeorm_1 = require("@nestjs/typeorm");
const media_controller_1 = require("./media.controller");
const media_service_1 = require("./media.service");
const media_processor_1 = require("./media.processor");
const shop_entity_1 = require("../../core/entities/shop.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({ name: 'media' }),
            typeorm_1.TypeOrmModule.forFeature([shop_entity_1.Shop, product_entity_1.Product, subscription_entity_1.Subscription]),
        ],
        controllers: [media_controller_1.MediaController],
        providers: [media_service_1.MediaService, media_processor_1.MediaProcessor],
        exports: [media_service_1.MediaService],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map