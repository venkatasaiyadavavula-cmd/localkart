"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = __importStar(require("crypto"));
const razorpay_config_1 = __importDefault(require("../../config/razorpay.config"));
const order_entity_1 = require("../../core/entities/order.entity");
const transaction_entity_1 = require("../../core/entities/transaction.entity");
const orders_service_1 = require("../orders/orders.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    orderRepository;
    transactionRepository;
    ordersService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(orderRepository, transactionRepository, ordersService) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.ordersService = ordersService;
    }
    async createRazorpayOrder(userId, createPaymentDto) {
        const { orderId } = createPaymentDto;
        const order = await this.orderRepository.findOne({
            where: { id: orderId, customerId: userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentMethod !== order_entity_1.PaymentMethod.RAZORPAY) {
            throw new common_1.BadRequestException('This order is not set for online payment');
        }
        if (order.paymentStatus === order_entity_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Order is already paid');
        }
        const amountInPaise = Math.round(order.totalAmount * 100);
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: order.id,
            payment_capture: 1,
            notes: {
                orderNumber: order.orderNumber,
                customerId: userId,
            },
        };
        try {
            const razorpayOrder = await razorpay_config_1.default.orders.create(options);
            await this.ordersService.updateRazorpayOrderId(order.id, razorpayOrder.id);
            return {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID,
            };
        }
        catch (error) {
            this.logger.error(`Razorpay order creation failed: ${error.message}`);
            throw new common_1.BadRequestException('Failed to create payment order: ' + error.message);
        }
    }
    async verifyPayment(userId, verifyPaymentDto) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId, } = verifyPaymentDto;
        const order = await this.orderRepository.findOne({
            where: { id: internalOrderId, customerId: userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            await this.updateTransactionStatus(razorpay_payment_id, transaction_entity_1.TransactionStatus.FAILED, 'Invalid signature');
            return false;
        }
        await this.ordersService.confirmPaidOrder(internalOrderId, razorpay_payment_id);
        await this.updateTransactionStatus(razorpay_payment_id, transaction_entity_1.TransactionStatus.SUCCESS);
        return true;
    }
    async initiateCodOrder(userId, createPaymentDto) {
        const { orderId } = createPaymentDto;
        const order = await this.orderRepository.findOne({
            where: { id: orderId, customerId: userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentMethod !== order_entity_1.PaymentMethod.COD) {
            throw new common_1.BadRequestException('This order is not set for COD');
        }
        return { message: 'COD order confirmed. OTP sent to registered mobile.' };
    }
    async processRazorpayWebhook(event) {
        const { event: eventType, payload } = event;
        switch (eventType) {
            case 'payment.captured':
                return this.handlePaymentCaptured(payload.payment.entity);
            case 'payment.failed':
                return this.handlePaymentFailed(payload.payment.entity);
            case 'refund.processed':
                return this.handleRefundProcessed(payload.refund.entity);
            default:
                this.logger.log(`Unhandled webhook event: ${eventType}`);
        }
    }
    async handlePaymentCaptured(payment) {
        const orderId = payment.notes?.orderId || payment.order_id;
        const razorpayPaymentId = payment.id;
        const transaction = await this.transactionRepository.findOne({
            where: { razorpayPaymentId },
        });
        if (transaction) {
            transaction.status = transaction_entity_1.TransactionStatus.SUCCESS;
            transaction.metadata = payment;
            await this.transactionRepository.save(transaction);
        }
        const order = await this.orderRepository.findOne({
            where: { id: payment.order_id },
        });
        if (order) {
            await this.ordersService.confirmPaidOrder(order.id, razorpayPaymentId);
        }
    }
    async handlePaymentFailed(payment) {
        const razorpayPaymentId = payment.id;
        await this.updateTransactionStatus(razorpayPaymentId, transaction_entity_1.TransactionStatus.FAILED, payment.error_description || 'Payment failed');
    }
    async handleRefundProcessed(refund) {
        const paymentId = refund.payment_id;
        const transaction = await this.transactionRepository.findOne({
            where: { razorpayPaymentId: paymentId },
        });
        if (transaction) {
            const refundTransaction = this.transactionRepository.create({
                orderId: transaction.orderId,
                type: transaction_entity_1.TransactionType.REFUND,
                status: transaction_entity_1.TransactionStatus.SUCCESS,
                amount: refund.amount / 100,
                currency: refund.currency,
                razorpayPaymentId: refund.id,
                metadata: refund,
            });
            await this.transactionRepository.save(refundTransaction);
            await this.orderRepository.update({ id: transaction.orderId }, { paymentStatus: order_entity_1.PaymentStatus.REFUNDED });
        }
    }
    async updateTransactionStatus(razorpayPaymentId, status, failureReason) {
        const transaction = await this.transactionRepository.findOne({
            where: { razorpayPaymentId },
        });
        if (transaction) {
            transaction.status = status;
            if (failureReason)
                transaction.failureReason = failureReason;
            await this.transactionRepository.save(transaction);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        orders_service_1.OrdersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map