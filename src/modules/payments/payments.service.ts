import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import razorpayInstance from '../../config/razorpay.config';
import { Order, PaymentMethod, PaymentStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../core/entities/transaction.entity';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly ordersService: OrdersService,
  ) {}

  async createRazorpayOrder(userId: string, createPaymentDto: CreatePaymentDto) {
    const { orderId } = createPaymentDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== PaymentMethod.RAZORPAY) {
      throw new BadRequestException('This order is not set for online payment');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Create Razorpay order
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
      const razorpayOrder = await razorpayInstance.orders.create(options);

      // Save Razorpay order ID
      await this.ordersService.updateRazorpayOrderId(order.id, razorpayOrder.id);

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      this.logger.error(`Razorpay order creation failed: ${error.message}`);
      throw new BadRequestException('Failed to create payment order: ' + error.message);
    }
  }

  async verifyPayment(userId: string, verifyPaymentDto: VerifyPaymentDto) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internalOrderId,
    } = verifyPaymentDto;

    const order = await this.orderRepository.findOne({
      where: { id: internalOrderId, customerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Update transaction as failed
      await this.updateTransactionStatus(
        razorpay_payment_id,
        TransactionStatus.FAILED,
        'Invalid signature',
      );
      return false;
    }

    // Update order and transaction
    await this.ordersService.confirmPaidOrder(internalOrderId, razorpay_payment_id);

    await this.updateTransactionStatus(
      razorpay_payment_id,
      TransactionStatus.SUCCESS,
    );

    return true;
  }

  async initiateCodOrder(userId: string, createPaymentDto: CreatePaymentDto) {
    const { orderId } = createPaymentDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException('This order is not set for COD');
    }

    // For COD, we just need to trigger OTP sending (already done in order creation)
    // This endpoint is for confirming COD after OTP verification? Actually OTP is separate.

    return { message: 'COD order confirmed. OTP sent to registered mobile.' };
  }

  // Webhook processing methods
  async processRazorpayWebhook(event: any) {
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

  private async handlePaymentCaptured(payment: any) {
    const orderId = payment.notes?.orderId || payment.order_id; // Depending on note
    const razorpayPaymentId = payment.id;

    const transaction = await this.transactionRepository.findOne({
      where: { razorpayPaymentId },
    });

    if (transaction) {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.metadata = payment;
      await this.transactionRepository.save(transaction);
    }

    // Find order by razorpay_order_id
    const order = await this.orderRepository.findOne({
      where: { id: payment.order_id }, // receipt = internal order id
    });

    if (order) {
      await this.ordersService.confirmPaidOrder(order.id, razorpayPaymentId);
    }
  }

  private async handlePaymentFailed(payment: any) {
    const razorpayPaymentId = payment.id;
    await this.updateTransactionStatus(
      razorpayPaymentId,
      TransactionStatus.FAILED,
      payment.error_description || 'Payment failed',
    );
  }

  private async handleRefundProcessed(refund: any) {
    // Update transaction for refund
    const paymentId = refund.payment_id;
    const transaction = await this.transactionRepository.findOne({
      where: { razorpayPaymentId: paymentId },
    });

    if (transaction) {
      // Create refund transaction
      const refundTransaction = this.transactionRepository.create({
        orderId: transaction.orderId,
        type: TransactionType.REFUND,
        status: TransactionStatus.SUCCESS,
        amount: refund.amount / 100,
        currency: refund.currency,
        razorpayPaymentId: refund.id,
        metadata: refund,
      });
      await this.transactionRepository.save(refundTransaction);

      // Update order payment status
      await this.orderRepository.update(
        { id: transaction.orderId },
        { paymentStatus: PaymentStatus.REFUNDED },
      );
    }
  }

  private async updateTransactionStatus(
    razorpayPaymentId: string,
    status: TransactionStatus,
    failureReason?: string,
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { razorpayPaymentId },
    });

    if (transaction) {
      transaction.status = status;
      if (failureReason) transaction.failureReason = failureReason;
      await this.transactionRepository.save(transaction);
    }
  }
}
