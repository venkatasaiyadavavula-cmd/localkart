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
var ReturnsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const return_request_entity_1 = require("../../core/entities/return-request.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const order_item_entity_1 = require("../../core/entities/order-item.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const user_entity_1 = require("../../core/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const storage_config_1 = require("../../config/storage.config");
let ReturnsService = ReturnsService_1 = class ReturnsService {
    returnRepository;
    orderRepository;
    orderItemRepository;
    productRepository;
    shopRepository;
    userRepository;
    dataSource;
    notificationsService;
    logger = new common_1.Logger(ReturnsService_1.name);
    constructor(returnRepository, orderRepository, orderItemRepository, productRepository, shopRepository, userRepository, dataSource, notificationsService) {
        this.returnRepository = returnRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.notificationsService = notificationsService;
    }
    async createReturnRequest(userId, dto, files) {
        const { orderId, reason, description } = dto;
        const order = await this.orderRepository.findOne({
            where: { id: orderId, customerId: userId },
            relations: ['shop', 'items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== order_entity_1.OrderStatus.DELIVERED) {
            throw new common_1.BadRequestException('Return can only be requested for delivered orders');
        }
        const deliveredAt = order.deliveredAt;
        if (!deliveredAt) {
            throw new common_1.BadRequestException('Order delivery time not recorded');
        }
        const hoursSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceDelivery > 24) {
            throw new common_1.BadRequestException('Return window of 24 hours has expired');
        }
        const existingReturn = await this.returnRepository.findOne({
            where: { orderId },
        });
        if (existingReturn) {
            throw new common_1.BadRequestException('Return request already exists for this order');
        }
        const evidenceUrls = [];
        for (const file of files) {
            const key = `returns/${orderId}/${Date.now()}-${file.originalname}`;
            const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
            evidenceUrls.push(`https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`);
        }
        const refundAmount = order.totalAmount - order.deliveryCharge;
        const returnRequest = this.returnRepository.create({
            orderId,
            customerId: userId,
            shopId: order.shopId,
            reason,
            description,
            evidenceImages: evidenceUrls.filter(u => u.match(/\.(jpg|jpeg|png|webp)$/i)),
            evidenceVideo: evidenceUrls.find(u => u.match(/\.(mp4|mov)$/i)),
            status: return_request_entity_1.ReturnStatus.PENDING,
            refundAmount,
        });
        await this.returnRepository.save(returnRequest);
        order.status = order_entity_1.OrderStatus.RETURN_REQUESTED;
        await this.orderRepository.save(order);
        await this.notificationsService.sendSellerNotification(order.shop.ownerId, 'New Return Request', `Customer has requested return for order #${order.orderNumber}`);
        return returnRequest;
    }
    async getUserReturnRequests(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [requests, total] = await this.returnRepository.findAndCount({
            where: { customerId: userId },
            relations: ['order', 'order.shop'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: requests,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getReturnRequestById(id, userId, role) {
        const request = await this.returnRepository.findOne({
            where: { id },
            relations: ['order', 'order.shop', 'customer'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found');
        }
        if (role === user_entity_1.UserRole.CUSTOMER && request.customerId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (role === user_entity_1.UserRole.SELLER && request.shopId !== (await this.getShopIdByOwner(userId))) {
            throw new common_1.ForbiddenException('Access denied');
        }
        delete request.customer.password;
        return request;
    }
    async cancelReturnRequest(id, userId) {
        const request = await this.returnRepository.findOne({
            where: { id, customerId: userId },
            relations: ['order'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found');
        }
        if (request.status !== return_request_entity_1.ReturnStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending return requests can be cancelled');
        }
        request.status = return_request_entity_1.ReturnStatus.CANCELLED;
        await this.returnRepository.save(request);
        const order = request.order;
        order.status = order_entity_1.OrderStatus.DELIVERED;
        await this.orderRepository.save(order);
        return { message: 'Return request cancelled' };
    }
    async getSellerPendingReturns(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.returnRepository.find({
            where: { shopId: shop.id, status: return_request_entity_1.ReturnStatus.PENDING },
            relations: ['order', 'customer'],
            order: { createdAt: 'DESC' },
        });
    }
    async approveReturnRequest(id, ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const request = await this.returnRepository.findOne({
            where: { id, shopId: shop.id },
            relations: ['order', 'customer'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found');
        }
        if (request.status !== return_request_entity_1.ReturnStatus.PENDING) {
            throw new common_1.BadRequestException('Request already processed');
        }
        request.status = return_request_entity_1.ReturnStatus.APPROVED;
        await this.returnRepository.save(request);
        await this.notificationsService.sendCustomerNotification(request.customerId, 'Return Request Approved', `Your return request for order #${request.order.orderNumber} has been approved.`);
        return request;
    }
    async rejectReturnRequest(id, ownerId, reason) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const request = await this.returnRepository.findOne({
            where: { id, shopId: shop.id },
            relations: ['order'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found');
        }
        if (request.status !== return_request_entity_1.ReturnStatus.PENDING) {
            throw new common_1.BadRequestException('Request already processed');
        }
        request.status = return_request_entity_1.ReturnStatus.REJECTED;
        request.rejectionReason = reason;
        await this.returnRepository.save(request);
        const order = request.order;
        order.status = order_entity_1.OrderStatus.DELIVERED;
        await this.orderRepository.save(order);
        await this.notificationsService.sendCustomerNotification(request.customerId, 'Return Request Rejected', `Your return request was rejected. Reason: ${reason}`);
        return request;
    }
    async schedulePickup(id, ownerId, body) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const request = await this.returnRepository.findOne({
            where: { id, shopId: shop.id, status: return_request_entity_1.ReturnStatus.APPROVED },
        });
        if (!request) {
            throw new common_1.NotFoundException('Approved return request not found');
        }
        request.status = return_request_entity_1.ReturnStatus.PICKUP_SCHEDULED;
        request.pickupScheduledAt = new Date(body.pickupDate);
        request.pickupAddress = body.pickupAddress;
        request.pickupContactPhone = body.contactPhone;
        await this.returnRepository.save(request);
        await this.notificationsService.sendCustomerNotification(request.customerId, 'Return Pickup Scheduled', `Pickup scheduled for ${body.pickupDate}. Contact: ${body.contactPhone}`);
        return request;
    }
    async confirmPickup(id, ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const request = await this.returnRepository.findOne({
            where: { id, shopId: shop.id, status: return_request_entity_1.ReturnStatus.PICKUP_SCHEDULED },
            relations: ['order', 'order.items'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found or not scheduled');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            request.status = return_request_entity_1.ReturnStatus.PICKED_UP;
            await queryRunner.manager.save(request);
            const order = request.order;
            for (const item of order.items) {
                await queryRunner.manager.increment(product_entity_1.Product, { id: item.productId }, 'stock', item.quantity);
            }
            await queryRunner.commitTransaction();
            await this.notificationsService.sendAdminNotification('Return Pickup Confirmed', `Order #${order.orderNumber} return pickup confirmed. Refund pending.`);
            return request;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getAllReturnRequests(page, limit, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [requests, total] = await this.returnRepository.findAndCount({
            where,
            relations: ['order', 'order.shop', 'customer'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        requests.forEach(r => delete r.customer?.password);
        return {
            data: requests,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async adminUpdateReturnStatus(id, dto) {
        const request = await this.returnRepository.findOne({
            where: { id },
            relations: ['order'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Return request not found');
        }
        request.status = dto.status;
        if (dto.notes) {
            request.rejectionReason = dto.notes;
        }
        await this.returnRepository.save(request);
        return request;
    }
    async processRefund(id) {
        const request = await this.returnRepository.findOne({
            where: { id, status: return_request_entity_1.ReturnStatus.PICKED_UP },
            relations: ['order'],
        });
        if (!request) {
            throw new common_1.BadRequestException('Return request not ready for refund');
        }
        const order = request.order;
        if (order.paymentMethod === 'razorpay' && order.paymentStatus === order_entity_1.PaymentStatus.PAID) {
            this.logger.log(`Initiating refund for order ${order.orderNumber}, amount: ${request.refundAmount}`);
        }
        order.status = order_entity_1.OrderStatus.RETURNED;
        order.paymentStatus = order_entity_1.PaymentStatus.REFUNDED;
        await this.orderRepository.save(order);
        request.status = return_request_entity_1.ReturnStatus.REFUNDED;
        request.resolvedAt = new Date();
        await this.returnRepository.save(request);
        await this.notificationsService.sendCustomerNotification(request.customerId, 'Refund Processed', `Refund of ₹${request.refundAmount} for order #${order.orderNumber} has been initiated.`);
        return { message: 'Refund processed successfully' };
    }
    async getShopIdByOwner(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        return shop?.id;
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = ReturnsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(return_request_entity_1.ReturnRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(4, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        notifications_service_1.NotificationsService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map