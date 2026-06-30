"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStateMachine = void 0;
const common_1 = require("@nestjs/common");
const order_entity_1 = require("../../../core/entities/order.entity");
let OrderStateMachine = class OrderStateMachine {
    transitions = new Map([
        [
            order_entity_1.OrderStatus.PENDING_OTP,
            [order_entity_1.OrderStatus.CONFIRMED, order_entity_1.OrderStatus.CANCELLED],
        ],
        [
            order_entity_1.OrderStatus.CONFIRMED,
            [order_entity_1.OrderStatus.PROCESSING, order_entity_1.OrderStatus.CANCELLED],
        ],
        [
            order_entity_1.OrderStatus.PROCESSING,
            [order_entity_1.OrderStatus.READY_FOR_PICKUP, order_entity_1.OrderStatus.CANCELLED],
        ],
        [
            order_entity_1.OrderStatus.READY_FOR_PICKUP,
            [order_entity_1.OrderStatus.OUT_FOR_DELIVERY, order_entity_1.OrderStatus.CANCELLED],
        ],
        [
            order_entity_1.OrderStatus.OUT_FOR_DELIVERY,
            [order_entity_1.OrderStatus.DELIVERED, order_entity_1.OrderStatus.RETURN_REQUESTED],
        ],
        [
            order_entity_1.OrderStatus.DELIVERED,
            [order_entity_1.OrderStatus.RETURN_REQUESTED],
        ],
        [
            order_entity_1.OrderStatus.RETURN_REQUESTED,
            [order_entity_1.OrderStatus.RETURNED, order_entity_1.OrderStatus.DELIVERED],
        ],
        [
            order_entity_1.OrderStatus.RETURNED,
            [],
        ],
        [
            order_entity_1.OrderStatus.CANCELLED,
            [],
        ],
    ]);
    canTransition(currentStatus, targetStatus) {
        const allowed = this.transitions.get(currentStatus) || [];
        return allowed.includes(targetStatus);
    }
    getNextAllowedStatuses(currentStatus) {
        return this.transitions.get(currentStatus) || [];
    }
};
exports.OrderStateMachine = OrderStateMachine;
exports.OrderStateMachine = OrderStateMachine = __decorate([
    (0, common_1.Injectable)()
], OrderStateMachine);
//# sourceMappingURL=order-state-machine.js.map