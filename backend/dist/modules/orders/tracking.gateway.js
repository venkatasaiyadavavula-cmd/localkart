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
var TrackingGateway_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const order_entity_1 = require("../../core/entities/order.entity");
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    orderRepo;
    server;
    logger = new common_1.Logger(TrackingGateway_1.name);
    constructor(orderRepo) {
        this.orderRepo = orderRepo;
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinOrder(data, client) {
        const room = `order:${data.orderId}`;
        await client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
        if (order?.deliveryLatitude && order?.deliveryLongitude) {
            client.emit('location-update', {
                orderId: data.orderId,
                latitude: Number(order.deliveryLatitude),
                longitude: Number(order.deliveryLongitude),
                updatedAt: order.locationUpdatedAt,
                staffName: order.deliveryStaffName,
            });
        }
    }
    async handleLocationUpdate(data, client) {
        const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
        if (!order)
            return;
        await this.orderRepo.update(data.orderId, {
            deliveryLatitude: data.latitude,
            deliveryLongitude: data.longitude,
            locationUpdatedAt: new Date(),
            deliveryStaffName: data.staffName ?? order.deliveryStaffName,
            deliveryStaffPhone: data.staffPhone ?? order.deliveryStaffPhone,
        });
        this.server.to(`order:${data.orderId}`).emit('location-update', {
            orderId: data.orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            updatedAt: new Date(),
            staffName: data.staffName ?? order.deliveryStaffName,
        });
        this.logger.log(`Location updated: order=${data.orderId} lat=${data.latitude} lng=${data.longitude}`);
    }
    broadcastStatusChange(orderId, status) {
        this.server.to(`order:${orderId}`).emit('status-update', { orderId, status });
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-order'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], TrackingGateway.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update-location'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], TrackingGateway.prototype, "handleLocationUpdate", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
        namespace: '/tracking',
    }),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map