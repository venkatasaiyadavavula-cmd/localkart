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
const tracking_gateway_1 = require("./tracking.gateway");
const cart_service_1 = require("../cart/cart.service");
const notifications_service_1 = require("../notifications/notifications.service");
const helpers_1 = require("../../core/utils/helpers");
const shop_hours_util_1 = require("../../core/utils/shop-hours.util");
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
    notificationsService;
    trackingGateway;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(orderRepository, orderItemRepository, productRepository, shopRepository, userRepository, transactionRepository, cartService, dataSource, stateMachine, notificationsService, trackingGateway) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.cartService = cartService;
        this.dataSource = dataSource;
        this.stateMachine = stateMachine;
        this.notificationsService = notificationsService;
        this.trackingGateway = trackingGateway;
    }
    formatOrderResponse(order) {
        if (!order)
            return order;
        const { deliveryAddress, ...rest } = order;
        return {
            ...rest,
            deliveryAddress,
            shippingAddress: deliveryAddress,
        };
    }
    async createOrder(userId, createOrderDto) {
        const { paymentMethod = order_entity_1.PaymentMethod.COD, shippingAddress, deliveryNotes } = createOrderDto;
        if (paymentMethod === order_entity_1.PaymentMethod.RAZORPAY && process.env.PAYMENTS_ENABLED !== 'true') {
            throw new common_1.BadRequestException('Online payment is not available. Please use Cash on Delivery.');
        }
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
        const isOpen = (0, shop_hours_util_1.isShopCurrentlyOpen)(shop);
        const hoursStatus = (0, shop_hours_util_1.getShopHoursStatus)(shop);
        if (!isOpen) {
            throw new common_1.BadRequestException('Shop is currently closed');
        }
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
                totalAmount: subtotal,
                deliveryCharge,
                finalAmount: totalAmount,
                commissionPercent: commissionRate,
                commissionAmount,
                paymentMethod,
                paymentStatus: order_entity_1.PaymentStatus.PENDING,
                status: order_entity_1.OrderStatus.PENDING_OTP,
                deliveryAddress: shippingAddress,
                deliveryNotes,
                deliveryOtp: (0, helpers_1.generateOtp)(),
            });
            const savedOrder = await queryRunner.manager.save(order);
            const isCod = paymentMethod === order_entity_1.PaymentMethod.COD;
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
                if (isCod) {
                    product.stock -= item.quantity;
                    product.orderCount += 1;
                    await queryRunner.manager.save(product);
                }
            }
            if (isCod) {
                shop.totalOrders += 1;
                await queryRunner.manager.save(shop);
                await this.cartService.clearCart(userId);
            }
            this.logger.log(`Order OTP for ${orderNumber}: ${savedOrder.deliveryOtp}`);
            this.notificationsService
                .sendDeliveryOtp(user.phone, savedOrder.deliveryOtp)
                .catch((e) => this.logger.error('Delivery OTP SMS failed: ' + e.message));
            await queryRunner.commitTransaction();
            const fullOrder = await this.orderRepository.findOne({
                where: { id: savedOrder.id },
                relations: ['items', 'shop', 'customer'],
            });
            if (fullOrder.customer?.email) {
                this.notificationsService
                    .sendOrderConfirmationEmail(fullOrder.customer.email, {
                    orderNumber: fullOrder.orderNumber,
                    totalAmount: fullOrder.finalAmount,
                })
                    .catch((e) => this.logger.error('Order confirmation email failed: ' + e.message));
            }
            delete fullOrder.deliveryOtp;
            delete fullOrder.customer.password;
            if (fullOrder.customer?.phone) {
                const itemsSummary = fullOrder.items
                    .slice(0, 2)
                    .map((i) => i.productName)
                    .join(', ') + (fullOrder.items.length > 2 ? ` +${fullOrder.items.length - 2} more` : '');
                this.notificationsService.sendOrderPlacedWhatsApp(fullOrder.customer.phone, fullOrder.customer.name, fullOrder.orderNumber, fullOrder.shop.name, fullOrder.totalAmount, fullOrder.paymentMethod).catch((e) => this.logger.error('WhatsApp customer failed: ' + e.message));
                this.notificationsService.sendNewOrderWhatsApp(fullOrder.shop.contactPhone, fullOrder.shop.name, fullOrder.orderNumber, itemsSummary, fullOrder.totalAmount).catch((e) => this.logger.error('WhatsApp seller failed: ' + e.message));
            }
            return {
                ...this.formatOrderResponse(fullOrder),
                isShopOpen: isOpen,
                shopClosedMessage: null,
                shopStatusMessage: hoursStatus.statusMessage,
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
            relations: ['items', 'items.product', 'shop', 'customer'],
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
        return this.formatOrderResponse(order);
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
            relations: ['shop'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const { status, notes } = updateDto;
        if (!this.stateMachine.canTransition(order.status, status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${status}`);
        }
        order.status = status;
        if (status === order_entity_1.OrderStatus.OUT_FOR_DELIVERY) {
            order.deliveryOtp = order.deliveryOtp || (0, helpers_1.generateOtp)();
            if (!order.deliveryLatitude && order.shop?.latitude) {
                order.deliveryLatitude = Number(order.shop.latitude);
                order.deliveryLongitude = Number(order.shop.longitude);
                order.locationUpdatedAt = new Date();
            }
            if (!order.deliveryStaffName) {
                order.deliveryStaffName = 'Delivery Partner';
            }
            this.logger.log(`Delivery OTP for order ${order.orderNumber}: ${order.deliveryOtp}`);
        }
        if (notes) {
            order.deliveryNotes = notes;
        }
        await this.orderRepository.save(order);
        this.trackingGateway.emitStatusUpdate(orderId, { status });
        if (order.deliveryLatitude && order.deliveryLongitude) {
            this.trackingGateway.emitLocationUpdate(orderId, {
                latitude: Number(order.deliveryLatitude),
                longitude: Number(order.deliveryLongitude),
                updatedAt: new Date().toISOString(),
                staffName: order.deliveryStaffName ?? undefined,
            });
        }
        const fullOrder = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['customer'],
        });
        if (fullOrder?.customer?.phone) {
            this.notificationsService.sendOrderStatusWhatsApp(fullOrder.customer.phone, fullOrder.customer.name, order.orderNumber, status).catch((e) => this.logger.error('WhatsApp status update failed: ' + e.message));
        }
        return order;
    }
    async updateDeliveryLocation(orderId, sellerId, dto) {
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
        if (order.status !== order_entity_1.OrderStatus.OUT_FOR_DELIVERY) {
            throw new common_1.BadRequestException('Location updates allowed only during delivery');
        }
        order.deliveryLatitude = dto.latitude;
        order.deliveryLongitude = dto.longitude;
        order.locationUpdatedAt = new Date();
        if (dto.staffName)
            order.deliveryStaffName = dto.staffName;
        if (dto.staffPhone)
            order.deliveryStaffPhone = dto.staffPhone;
        await this.orderRepository.save(order);
        const payload = {
            latitude: dto.latitude,
            longitude: dto.longitude,
            updatedAt: new Date().toISOString(),
            staffName: order.deliveryStaffName ?? undefined,
        };
        this.trackingGateway.emitLocationUpdate(orderId, payload);
        return { message: 'Location updated', ...payload };
    }
    async adminUpdateOrderStatus(id, dto) {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order)
            throw new Error("Order not found");
        order.status = dto.status || dto;
        return this.orderRepository.save(order);
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
        const order = await this.orderRepository.findOne({
            where: { id: internalOrderId },
            relations: ['items', 'shop'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentStatus === order_entity_1.PaymentStatus.PAID) {
            return order;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            for (const item of order.items) {
                await queryRunner.manager.decrement(product_entity_1.Product, { id: item.productId }, 'stock', item.quantity);
                await queryRunner.manager.increment(product_entity_1.Product, { id: item.productId }, 'orderCount', item.quantity);
            }
            await queryRunner.manager.increment(shop_entity_1.Shop, { id: order.shopId }, 'totalOrders', 1);
            order.paymentStatus = order_entity_1.PaymentStatus.PAID;
            order.status = order_entity_1.OrderStatus.CONFIRMED;
            order.confirmedAt = new Date();
            order.razorpayPaymentId = razorpayPaymentId;
            await queryRunner.manager.save(order);
            await queryRunner.commitTransaction();
            await this.cartService.clearCart(order.customerId);
            return order;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateRazorpayOrderId(internalOrderId, razorpayOrderId) {
        await this.orderRepository.update({ id: internalOrderId }, { paymentStatus: order_entity_1.PaymentStatus.PENDING });
        const transaction = this.transactionRepository.create({});
        Object.assign(transaction, {
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
        order_state_machine_1.OrderStateMachine,
        notifications_service_1.NotificationsService,
        tracking_gateway_1.TrackingGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map