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
var TrackingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    logger = new common_1.Logger(TrackingGateway_1.name);
    server;
    afterInit() {
        this.logger.log('Tracking WebSocket gateway initialized');
    }
    handleJoinOrder(client, payload) {
        if (!payload?.orderId)
            return;
        const room = `order:${payload.orderId}`;
        client.join(room);
        this.logger.debug(`Client ${client.id} joined ${room}`);
        return { joined: true, orderId: payload.orderId };
    }
    emitLocationUpdate(orderId, data) {
        if (!this.server)
            return;
        this.server.to(`order:${orderId}`).emit('location-update', data);
    }
    emitStatusUpdate(orderId, data) {
        if (!this.server)
            return;
        this.server.to(`order:${orderId}`).emit('status-update', data);
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleJoinOrder", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/tracking',
        cors: {
            origin: [
                'https://localkart.store',
                'https://www.localkart.store',
                /\.vercel\.app$/,
                'http://localhost:3000',
            ],
            credentials: true,
        },
    })
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map