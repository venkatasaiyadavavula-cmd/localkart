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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ioredis_1 = require("ioredis");
const ioredis_2 = require("@nestjs-modules/ioredis");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
let CartService = class CartService {
    redis;
    productRepository;
    shopRepository;
    CART_PREFIX = 'cart:';
    CART_TTL = 7 * 24 * 60 * 60;
    constructor(redis, productRepository, shopRepository) {
        this.redis = redis;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }
    getCartKey(userId) {
        return `${this.CART_PREFIX}${userId}`;
    }
    async getCart(userId) {
        const cartKey = this.getCartKey(userId);
        const cartData = await this.redis.get(cartKey);
        if (!cartData) {
            return { items: [], totalAmount: 0, totalItems: 0 };
        }
        const items = JSON.parse(cartData);
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        return { items, totalAmount, totalItems };
    }
    async addToCart(userId, addToCartDto) {
        const { productId, quantity = 1 } = addToCartDto;
        const product = await this.productRepository.findOne({
            where: { id: productId, status: product_entity_1.ProductStatus.APPROVED },
            relations: ['shop'],
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.stock < quantity) {
            throw new common_1.BadRequestException(`Only ${product.stock} items available`);
        }
        if (product.shop.status !== shop_entity_1.ShopStatus.APPROVED) {
            throw new common_1.BadRequestException('Shop is not currently accepting orders');
        }
        const cartKey = this.getCartKey(userId);
        let items = [];
        const existingCart = await this.redis.get(cartKey);
        if (existingCart) {
            items = JSON.parse(existingCart);
            const existingShopId = items[0]?.shopId;
            if (existingShopId && existingShopId !== product.shopId) {
                throw new common_1.BadRequestException('You can only order from one shop at a time. Please clear cart first.');
            }
        }
        const existingItemIndex = items.findIndex((item) => item.productId === productId);
        if (existingItemIndex > -1) {
            const newQuantity = items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                throw new common_1.BadRequestException(`Cannot add more than available stock (${product.stock})`);
            }
            items[existingItemIndex].quantity = newQuantity;
        }
        else {
            items.push({
                productId: product.id,
                shopId: product.shopId,
                name: product.name,
                price: Number(product.price),
                quantity,
                image: product.images?.[0] || null,
                maxQuantity: product.stock,
            });
        }
        await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
        return this.getCart(userId);
    }
    async updateCartItem(userId, productId, updateDto) {
        const cartKey = this.getCartKey(userId);
        const existingCart = await this.redis.get(cartKey);
        if (!existingCart) {
            throw new common_1.NotFoundException('Cart is empty');
        }
        const items = JSON.parse(existingCart);
        const itemIndex = items.findIndex((item) => item.productId === productId);
        if (itemIndex === -1) {
            throw new common_1.NotFoundException('Product not in cart');
        }
        const product = await this.productRepository.findOne({
            where: { id: productId, status: product_entity_1.ProductStatus.APPROVED },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const newQuantity = updateDto.quantity;
        if (newQuantity > product.stock) {
            throw new common_1.BadRequestException(`Only ${product.stock} items available`);
        }
        items[itemIndex].quantity = newQuantity;
        await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
        return this.getCart(userId);
    }
    async removeCartItem(userId, productId) {
        const cartKey = this.getCartKey(userId);
        const existingCart = await this.redis.get(cartKey);
        if (!existingCart) {
            return { message: 'Cart is empty' };
        }
        let items = JSON.parse(existingCart);
        items = items.filter((item) => item.productId !== productId);
        if (items.length === 0) {
            await this.redis.del(cartKey);
        }
        else {
            await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
        }
        return this.getCart(userId);
    }
    async clearCart(userId) {
        const cartKey = this.getCartKey(userId);
        await this.redis.del(cartKey);
        return { message: 'Cart cleared' };
    }
    async validateCartForCheckout(userId) {
        const cart = await this.getCart(userId);
        if (cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const productIds = cart.items.map((item) => item.productId);
        const products = await this.productRepository.find({
            where: { id: In(productIds) },
            relations: ['shop'],
        });
        for (const item of cart.items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new common_1.BadRequestException(`Product ${item.name} is no longer available`);
            }
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Only ${product.stock} of ${item.name} available`);
            }
            if (product.shop.status !== shop_entity_1.ShopStatus.APPROVED) {
                throw new common_1.BadRequestException(`Shop for ${item.name} is not accepting orders`);
            }
        }
        return { cart, products };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_2.InjectRedis)()),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map