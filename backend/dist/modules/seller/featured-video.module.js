"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedVideoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const featured_video_entity_1 = require("../../core/entities/featured-video.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const featured_video_service_1 = require("./featured-video.service");
let FeaturedVideoModule = class FeaturedVideoModule {
};
exports.FeaturedVideoModule = FeaturedVideoModule;
exports.FeaturedVideoModule = FeaturedVideoModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([featured_video_entity_1.FeaturedVideo, product_entity_1.Product, shop_entity_1.Shop])],
        providers: [featured_video_service_1.FeaturedVideoService],
        exports: [featured_video_service_1.FeaturedVideoService],
    })
], FeaturedVideoModule);
//# sourceMappingURL=featured-video.module.js.map