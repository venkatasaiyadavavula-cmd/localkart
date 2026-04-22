"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const seller_service_1 = require("./seller.service");
const subscription_service_1 = require("./subscription.service");
const earnings_service_1 = require("./earnings.service");
const ad_campaign_service_1 = require("./ad-campaign.service");
const shop_profile_dto_1 = require("./dto/shop-profile.dto");
const subscription_plan_dto_1 = require("./dto/subscription-plan.dto");
const ad_campaign_dto_1 = require("./dto/ad-campaign.dto");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
let SellerController = class SellerController {
    sellerService;
    subscriptionService;
    earningsService;
    adCampaignService;
    constructor(sellerService, subscriptionService, earningsService, adCampaignService) {
        this.sellerService = sellerService;
        this.subscriptionService = subscriptionService;
        this.earningsService = earningsService;
        this.adCampaignService = adCampaignService;
    }
    async getMyShop(user) {
        return this.sellerService.getShopByOwner(user.id);
    }
    async createShop(user, shopProfileDto) {
        return this.sellerService.createShop(user.id, shopProfileDto);
    }
    async updateShop(user, shopProfileDto) {
        return this.sellerService.updateShop(user.id, shopProfileDto);
    }
    async uploadShopLogo(user, file) {
        return this.sellerService.uploadShopLogo(user.id, file);
    }
    async uploadShopBanner(user, file) {
        return this.sellerService.uploadShopBanner(user.id, file);
    }
    async getDashboard(user) {
        return this.sellerService.getDashboardStats(user.id);
    }
    async getSalesChart(user, period = 'week') {
        return this.sellerService.getSalesChart(user.id, period);
    }
    async getCurrentSubscription(user) {
        return this.subscriptionService.getCurrentSubscription(user.id);
    }
    async getAvailablePlans() {
        return this.subscriptionService.getAvailablePlans();
    }
    async subscribe(user, subscribeDto) {
        return this.subscriptionService.subscribe(user.id, subscribeDto);
    }
    async cancelSubscription(user) {
        return this.subscriptionService.cancelSubscription(user.id);
    }
    async getSubscriptionHistory(user) {
        return this.subscriptionService.getSubscriptionHistory(user.id);
    }
    async getEarnings(user, period) {
        return this.earningsService.getEarningsSummary(user.id, period);
    }
    async getEarningsTransactions(user, page, limit) {
        return this.earningsService.getTransactions(user.id, parseInt(page || '1'), parseInt(limit || '20'));
    }
    async getPayouts(user) {
        return this.earningsService.getPayouts(user.id);
    }
    async getAdCampaigns(user) {
        return this.adCampaignService.getCampaigns(user.id);
    }
    async createAdCampaign(user, dto) {
        return this.adCampaignService.createCampaign(user.id, dto);
    }
    async updateAdCampaign(user, id, dto) {
        return this.adCampaignService.updateCampaign(user.id, id, dto);
    }
    async pauseAdCampaign(user, id) {
        return this.adCampaignService.pauseCampaign(user.id, id);
    }
    async resumeAdCampaign(user, id) {
        return this.adCampaignService.resumeCampaign(user.id, id);
    }
    async getAdStats(user, id) {
        return this.adCampaignService.getCampaignStats(user.id, id);
    }
};
exports.SellerController = SellerController;
__decorate([
    (0, common_1.Get)('shop'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getMyShop", null);
__decorate([
    (0, common_1.Post)('shop'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shop_profile_dto_1.ShopProfileDto]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "createShop", null);
__decorate([
    (0, common_1.Put)('shop'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shop_profile_dto_1.ShopProfileDto]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "updateShop", null);
__decorate([
    (0, common_1.Post)('shop/logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "uploadShopLogo", null);
__decorate([
    (0, common_1.Post)('shop/banner'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof Express !== "undefined" && (_c = Express.Multer) !== void 0 && _c.File) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "uploadShopBanner", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/sales-chart'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getSalesChart", null);
__decorate([
    (0, common_1.Get)('subscription'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getCurrentSubscription", null);
__decorate([
    (0, common_1.Get)('subscription/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getAvailablePlans", null);
__decorate([
    (0, common_1.Post)('subscription/subscribe'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscription_plan_dto_1.SubscribeDto]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('subscription/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('subscription/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getSubscriptionHistory", null);
__decorate([
    (0, common_1.Get)('earnings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)('earnings/transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getEarningsTransactions", null);
__decorate([
    (0, common_1.Get)('earnings/payouts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Get)('ads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getAdCampaigns", null);
__decorate([
    (0, common_1.Post)('ads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ad_campaign_dto_1.CreateAdCampaignDto]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "createAdCampaign", null);
__decorate([
    (0, common_1.Put)('ads/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ad_campaign_dto_1.UpdateAdCampaignDto]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "updateAdCampaign", null);
__decorate([
    (0, common_1.Post)('ads/:id/pause'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "pauseAdCampaign", null);
__decorate([
    (0, common_1.Post)('ads/:id/resume'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "resumeAdCampaign", null);
__decorate([
    (0, common_1.Get)('ads/:id/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SellerController.prototype, "getAdStats", null);
exports.SellerController = SellerController = __decorate([
    (0, common_1.Controller)('seller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __metadata("design:paramtypes", [seller_service_1.SellerService,
        subscription_service_1.SubscriptionService,
        earnings_service_1.EarningsService,
        ad_campaign_service_1.AdCampaignService])
], SellerController);
//# sourceMappingURL=seller.controller.js.map