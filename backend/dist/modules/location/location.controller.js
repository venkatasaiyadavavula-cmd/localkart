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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const common_1 = require("@nestjs/common");
const location_service_1 = require("./location.service");
const nearby_shops_dto_1 = require("./dto/nearby-shops.dto");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const public_decorator_1 = require("../../core/decorators/public.decorator");
let LocationController = class LocationController {
    locationService;
    constructor(locationService) {
        this.locationService = locationService;
    }
    async getNearbyShops(query) {
        return this.locationService.findNearbyShops(query);
    }
    async searchShops(lat, lng, radius, query) {
        return this.locationService.searchShopsByName(lat, lng, radius, query);
    }
    async getAvailableCities() {
        return this.locationService.getAvailableCities();
    }
    async getPincodesByCity(city) {
        return this.locationService.getPincodesByCity(city);
    }
    async checkServiceability(lat, lng, radius) {
        const radiusNum = radius ? parseInt(radius, 10) : 20;
        return this.locationService.checkServiceability(lat, lng, radiusNum);
    }
};
exports.LocationController = LocationController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('nearby-shops'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [nearby_shops_dto_1.NearbyShopsDto]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getNearbyShops", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search-shops'),
    __param(0, (0, common_1.Query)('lat', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('lng', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radius', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "searchShops", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getAvailableCities", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('pincodes'),
    __param(0, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getPincodesByCity", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('check-serviceability'),
    __param(0, (0, common_1.Query)('lat', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('lng', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radius')),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "checkServiceability", null);
exports.LocationController = LocationController = __decorate([
    (0, common_1.Controller)('location'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [location_service_1.LocationService])
], LocationController);
//# sourceMappingURL=location.controller.js.map