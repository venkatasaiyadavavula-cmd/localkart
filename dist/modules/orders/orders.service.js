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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../core/entities/order.entity");
const order_item_entity_1 = require("../../core/entities/order-item.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const order_state_machine_1 = require("./workflows/order-state-machine");
const cart_service_1 = require("../cart/cart.service");
const helpers_1 = require("../../core/utils/helpers");
let OrdersService = OrdersService_1 = class OrdersService {
    orderRepository;
    orderItemRepository;
    productRepository;
    shopRepository;
    userRepository;
    transactionRepository;
    cartService;
    dataSource;
    stateMachine;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(orderRepository, orderItemRepository, productRepository, shopRepository, userRepository, transactionRepository, cartService, dataSource, stateMachine) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.cartService = cartService;
        this.dataSource = dataSource;
        this.stateMachine = stateMachine;
    }
    isShopOpen(shop) {
        if (!shop.openingTime || !shop.closingTime) {
            return true;
        }
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [openHour, openMinute] = shop.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = shop.closingTime.split(':').map(Number);
        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;
        return currentTime >= openTime && currentTime <= closeTime;
    }
    getNextOpeningTime(shop) {
        if (!shop.openingTime)
            return 'tomorrow morning';
        const now = new Date();
        const [openHour, openMinute] = shop.openingTime.split(':').map(Number);
        const nextOpen = new Date(now);
        if (now.getHours() > openHour || (now.getHours() === openHour && now.getMinutes() >= openMinute)) {
            nextOpen.setDate(nextOpen.getDate() + 1);
        }
        nextOpen.setHours(openHour, openMinute, 0, 0);
        return nextOpen.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    async createOrder(userId, createOrderDto) {
        const { paymentMethod = order_entity_1.PaymentMethod.COD, shippingAddress, deliveryNotes } = createOrderDto;
        const { cart, products } = await this.cartService.validateCartForCheckout(userId);
        if (cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const shopId = cart.items[0].shopId;
        const shop = await this.shopRepository.findOne({
            where: { id: shopId, status: shop_entity_1.ShopStatus.APPROVED },
        });
        if (!shop) {
            throw new common_1.BadRequestException('Shop is not available');
        }
        const isOpen = this.isShopOpen(shop);
        const nextOpeningTime = this.getNextOpeningTime(shop);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryCharge = subtotal >= shop.freeDeliveryAbove ? 0 : shop.deliveryCharge;
        const totalAmount = subtotal + deliveryCharge;
        const commissionRate = this.calculateCommissionRate(products);
        const commissionAmount = (subtotal * commissionRate) / 100;
        const orderNumber = (0, helpers_1.generateOrderNumber)();
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const order = this.orderRepository.create({
                orderNumber,
                customerId: userId,
                shopId,
                subtotal,
                deliveryCharge,
                totalAmount,
                commissionRate,
                commissionAmount,
                paymentMethod,
                paymentStatus: paymentMethod === order_entity_1.PaymentMethod.COD ? order_entity_1.PaymentStatus.PENDING : order_entity_1.PaymentStatus.PENDING,
                status: order_entity_1.OrderStatus.PENDING_OTP,
                shippingAddress,
                deliveryNotes,
                deliveryOtp: (0, helpers_1.generateOtp)(),
            });
            const savedOrder = await queryRunner.manager.save(order);
            for (const item of cart.items) {
                const product = products.find((p) => p.id === item.productId);
                if (!product)
                    continue;
                const orderItem = this.orderItemRepository.create({
                    orderId: savedOrder.id,
                    productId: item.productId,
                    productName: item.name,
                    productImage: item.image,
                    quantity: item.quantity,
                    pricePerUnit: item.price,
                    totalPrice: item.price * item.quantity,
                    commissionRate: this.getProductCommissionRate(product),
                    commissionAmount: (item.price * item.quantity * this.getProductCommissionRate(product)) / 100,
                });
                await queryRunner.manager.save(orderItem);
                product.stock -= item.quantity;
                product.orderCount += 1;
                await queryRunner.manager.save(product);
            }
            shop.totalOrders += 1;
            await queryRunner.manager.save(shop);
            await this.cartService.clearCart(userId);
            this.logger.log(`Order OTP for ${orderNumber}: ${savedOrder.deliveryOtp}`);
            await queryRunner.commitTransaction();
            const fullOrder = await this.orderRepository.findOne({
                where: { id: savedOrder.id },
                relations: ['items', 'shop', 'customer'],
            });
            delete fullOrder.deliveryOtp;
            delete fullOrder.customer.password;
            return {
                ...fullOrder,
                isShopOpen: isOpen,
                shopClosedMessage: isOpen ? null : `Shop is currently closed. Your order will be processed after ${nextOpeningTime}.`,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Order creation failed: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to create order: ' + error.message);
        }
        finally {
            await queryRunner.release();
        }
    }
    calculateCommissionRate(products) {
        const rates = products.map((p) => this.getProductCommissionRate(p));
        return Math.max(...rates);
    }
    getProductCommissionRate(product) {
        const rates = {
            groceries: 2,
            fashion: 4,
            electronics: 3,
            home_essentials: 4,
            beauty: 5,
            accessories: 5,
        };
        return rates[product.categoryType] || 0;
    }
    async verifyDeliveryOtp(orderId, otp, currentUser) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['shop', 'customer'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (currentUser.role === user_entity_1.UserRole.CUSTOMER && order.customerId !== currentUser.id) {
            throw new common_1.ForbiddenException('You can only verify OTP for your own orders');
        }
        if (currentUser.role === user_entity_1.UserRole.SELLER && order.shop.ownerId !== currentUser.id) {
            throw new common_1.ForbiddenException('You can only verify OTP for your shop orders');
        }
        if (order.deliveryOtp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (currentUser.role === user_entity_1.UserRole.CUSTOMER) {
            if (order.status !== order_entity_1.OrderStatus.OUT_FOR_DELIVERY) {
                throw new common_1.BadRequestException('Order is not out for delivery');
            }
            order.status = order_entity_1.OrderStatus.DELIVERED;
            order.deliveredAt = new Date();
            order.paymentStatus = order_entity_1.PaymentStatus.PAID;
            order.deliveryOtp = null;
        }
        else if (currentUser.role === user_entity_1.UserRole.SELLER) {
            if (order.status !== order_entity_1.OrderStatus.PENDING_OTP) {
                throw new common_1.BadRequestException('Order is not pending OTP');
            }
            order.status = order_entity_1.OrderStatus.CONFIRMED;
            order.confirmedAt = new Date();
            order.deliveryOtp = null;
        }
        await this.orderRepository.save(order);
        return { message: 'OTP verified successfully', order };
    }
    async getUserOrders(userId, page, limit, status) {
        const skip = (page - 1) * limit;
        const where = { customerId: userId };
        if (status)
            where.status = status;
        const [orders, total] = await this.orderRepository.findAndCount({
            where,
            relations: ['items', 'shop'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: orders,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getOrderById(id, userId, role) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items', 'shop', 'customer'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (role === user_entity_1.UserRole.CUSTOMER && order.customerId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (role === user_entity_1.UserRole.SELLER && order.shop.ownerId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        delete order.deliveryOtp;
        delete order.customer.password;
        return order;
    }
    async cancelOrder(orderId, userId, reason) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, customerId: userId },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (!this.stateMachine.canTransition(order.status, order_entity_1.OrderStatus.CANCELLED)) {
            throw new common_1.BadRequestException(`Cannot cancel order in ${order.status} status`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            for (const item of order.items) {
                await queryRunner.manager.increment(product_entity_1.Product, { id: item.productId }, 'stock', item.quantity);
            }
            order.status = order_entity_1.OrderStatus.CANCELLED;
            order.cancelledAt = new Date();
            order.cancellationReason = reason || 'Customer cancelled';
            if (order.paymentMethod === order_entity_1.PaymentMethod.RAZORPAY && order.paymentStatus === order_entity_1.PaymentStatus.PAID) {
                order.paymentStatus = order_entity_1.PaymentStatus.PENDING;
            }
            await queryRunner.manager.save(order);
            await queryRunner.commitTransaction();
            return { message: 'Order cancelled successfully', order };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getSellerOrders(sellerId, page, limit, status) {
        const shop = await this.shopRepository.findOne({ where: { ownerId: sellerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const skip = (page - 1) * limit;
        const where = { shopId: shop.id };
        if (status)
            where.status = status;
        const [orders, total] = await this.orderRepository.findAndCount({
            where,
            relations: ['items', 'customer'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        orders.forEach((order) => {
            delete order.customer?.password;
            delete order.deliveryOtp;
        });
        return {
            data: orders,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async updateOrderStatusBySeller(orderId, sellerId, updateDto) {
        const shop = await this.shopRepository.findOne({ where: { ownerId: sellerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const order = await this.orderRepository.findOne({
            where: { id: orderId, shopId: shop.id },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const { status, notes } = updateDto;
        if (!this.stateMachine.canTransition(order.status, status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${status}`);
        }
        order.status = status;
        if (status === order_entity_1.OrderStatus.OUT_FOR_DELIVERY && order.paymentMethod === order_entity_1.PaymentMethod.COD) {
            order.deliveryOtp = (0, helpers_1.generateOtp)();
            this.logger.log(`Delivery OTP for order ${order.orderNumber}: ${order.deliveryOtp}`);
        }
        if (notes) {
            order.deliveryNotes = notes;
        }
        await this.orderRepository.save(order);
        return order;
    }
    async adminUpdateOrderStatus(orderId, updateDto) {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const { status } = updateDto;
        if (!this.stateMachine.canTransition(order.status, status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${status}`);
        }
        order.status = status;
        await this.orderRepository.save(order);
        return order;
    }
    async getAllOrders(page, limit, status, shopId) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (shopId)
            where.shopId = shopId;
        const [orders, total] = await this.orderRepository.findAndCount({
            where,
            relations: ['shop', 'customer', 'items'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        orders.forEach((o) => {
            delete o.customer?.password;
            delete o.deliveryOtp;
        });
        return {
            data: orders,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async trackOrderByNumber(orderNumber) {
        const order = await this.orderRepository.findOne({
            where: { orderNumber },
            relations: ['shop'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return {
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            estimatedDelivery: order.status === order_entity_1.OrderStatus.OUT_FOR_DELIVERY ? 'Today' : 'Processing',
            shop: {
                name: order.shop.name,
                phone: order.shop.contactPhone,
            },
        };
    }
    async confirmPaidOrder(internalOrderId, razorpayPaymentId) {
        const order = await this.orderRepository.findOne({ where: { id: internalOrderId } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        order.paymentStatus = order_entity_1.PaymentStatus.PAID;
        order.status = order_entity_1.OrderStatus.CONFIRMED;
        order.confirmedAt = new Date();
        await this.orderRepository.save(order);
        return order;
    }
    async updateRazorpayOrderId(internalOrderId, razorpayOrderId) {
        await this.orderRepository.update({ id: internalOrderId }, { paymentStatus: order_entity_1.PaymentStatus.PENDING });
        const transaction = this.transactionRepository.create({
            orderId: internalOrderId,
            razorpayOrderId,
            type: 'payment',
            status: 'pending',
            amount: 0,
            currency: 'INR',
        });
        await this.transactionRepository.save(transaction);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cart_service_1.CartService,
        typeorm_2.DataSource,
        order_state_machine_1.OrderStateMachine])
], OrdersService);
//# sourceMappingURL=orders.service.js.map