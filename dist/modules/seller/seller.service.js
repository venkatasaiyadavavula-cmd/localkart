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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SellerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const slugify_1 = __importDefault(require("slugify"));
const shop_entity_1 = require("../../core/entities/shop.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const storage_config_1 = require("../../config/storage.config");
let SellerService = SellerService_1 = class SellerService {
    shopRepository;
    userRepository;
    productRepository;
    orderRepository;
    logger = new common_1.Logger(SellerService_1.name);
    constructor(shopRepository, userRepository, productRepository, orderRepository) {
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }
    async getShopByOwner(ownerId) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId },
            relations: ['owner'],
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found. Please create your shop first.');
        }
        delete shop.owner.password;
        return shop;
    }
    async createShop(ownerId, shopProfileDto) {
        const existingShop = await this.shopRepository.findOne({
            where: { ownerId },
        });
        if (existingShop) {
            throw new common_1.BadRequestException('You already have a shop');
        }
        const user = await this.userRepository.findOne({ where: { id: ownerId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const slug = (0, slugify_1.default)(shopProfileDto.name, { lower: true, strict: true });
        const existingSlug = await this.shopRepository.findOne({ where: { slug } });
        if (existingSlug) {
            throw new common_1.BadRequestException('Shop name already taken');
        }
        const shop = this.shopRepository.create({
            ...shopProfileDto,
            slug,
            ownerId,
            status: shop_entity_1.ShopStatus.PENDING,
            location: () => `ST_SetSRID(ST_MakePoint(${shopProfileDto.longitude}, ${shopProfileDto.latitude}), 4326)`,
        });
        await this.shopRepository.save(shop);
        if (user.role !== 'seller') {
            user.role = 'seller';
            await this.userRepository.save(user);
        }
        return shop;
    }
    async updateShop(ownerId, shopProfileDto) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        if (shopProfileDto.name) {
            shop.slug = (0, slugify_1.default)(shopProfileDto.name, { lower: true, strict: true });
        }
        if (shopProfileDto.latitude && shopProfileDto.longitude) {
            shop.location = () => `ST_SetSRID(ST_MakePoint(${shopProfileDto.longitude}, ${shopProfileDto.latitude}), 4326)`;
        }
        Object.assign(shop, shopProfileDto);
        shop.status = shop_entity_1.ShopStatus.PENDING;
        await this.shopRepository.save(shop);
        return shop;
    }
    async uploadShopLogo(ownerId, file) {
        const shop = await this.getShopByOwner(ownerId);
        const key = `shops/${shop.id}/logo-${Date.now()}-${file.originalname}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        shop.logoImage = `https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`;
        await this.shopRepository.save(shop);
        return { uploadUrl, key, logoUrl: shop.logoImage };
    }
    async uploadShopBanner(ownerId, file) {
        const shop = await this.getShopByOwner(ownerId);
        const key = `shops/${shop.id}/banner-${Date.now()}-${file.originalname}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        shop.bannerImage = `https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`;
        await this.shopRepository.save(shop);
        return { uploadUrl, key, bannerUrl: shop.bannerImage };
    }
    async getDashboardStats(ownerId) {
        const shop = await this.getShopByOwner(ownerId);
        const totalProducts = await this.productRepository.count({
            where: { shopId: shop.id },
        });
        const totalOrders = await this.orderRepository.count({
            where: { shopId: shop.id },
        });
        const pendingOrders = await this.orderRepository.count({
            where: { shopId: shop.id, status: order_entity_1.OrderStatus.CONFIRMED },
        });
        const totalRevenue = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .where('order.shopId = :shopId', { shopId: shop.id })
            .andWhere('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .getRawOne();
        const todayOrders = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.shopId = :shopId', { shopId: shop.id })
            .andWhere('DATE(order.createdAt) = CURRENT_DATE')
            .getCount();
        const recentOrders = await this.orderRepository.find({
            where: { shopId: shop.id },
            relations: ['customer'],
            order: { createdAt: 'DESC' },
            take: 5,
        });
        return {
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue: totalRevenue?.total || 0,
            todayOrders,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                totalAmount: o.totalAmount,
                customerName: o.customer.name,
                createdAt: o.createdAt,
            })),
        };
    }
    async getSalesChart(ownerId, period) {
        const shop = await this.getShopByOwner(ownerId);
        let dateFormat;
        let interval;
        switch (period) {
            case 'week':
                dateFormat = 'Dy';
                interval = '7 days';
                break;
            case 'month':
                dateFormat = 'DD';
                interval = '30 days';
                break;
            case 'year':
                dateFormat = 'Mon';
                interval = '12 months';
                break;
            default:
                dateFormat = 'Dy';
                interval = '7 days';
        }
        const sales = await this.orderRepository
            .createQueryBuilder('order')
            .select(`DATE_TRUNC('day', order.createdAt)`, 'date')
            .addSelect('SUM(order.totalAmount)', 'sales')
            .addSelect('COUNT(*)', 'orders')
            .where('order.shopId = :shopId', { shopId: shop.id })
            .andWhere('order.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere(`order.createdAt >= NOW() - INTERVAL '${interval}'`)
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();
        return sales;
    }
};
exports.SellerService = SellerService;
exports.SellerService = SellerService = SellerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SellerService);
//# sourceMappingURL=seller.service.js.map