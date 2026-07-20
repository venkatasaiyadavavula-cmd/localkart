import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import razorpayInstance from '../../config/razorpay.config';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../core/entities/order.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../core/entities/transaction.entity';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RAZORPAY_ORDER_TTL_MS } from './payments.config';

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

    const reusable = await this.getReusableRazorpayOrder(order);
    if (reusable) {
      return reusable;
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
      const razorpayOrder = await razorpayInstance.orders.create(options);

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

  /** Reuse a non-expired pending Razorpay order instead of creating duplicates. */
  private async getReusableRazorpayOrder(order: Order) {
    if (!order.razorpayOrderId) {
      return null;
    }

    const pendingTxn = await this.transactionRepository.findOne({
      where: {
        orderId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (!pendingTxn) {
      return null;
    }

    const ageMs = Date.now() - new Date(pendingTxn.createdAt).getTime();
    if (ageMs >= RAZORPAY_ORDER_TTL_MS) {
      return null;
    }

    return {
      orderId: order.razorpayOrderId,
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    };
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

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await this.updateTransactionStatus(
        razorpay_payment_id,
        TransactionStatus.FAILED,
        'Invalid signature',
      );
      return false;
    }

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
    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;

    let transaction = await this.transactionRepository.findOne({
      where: { razorpayPaymentId },
    });

    if (!transaction && razorpayOrderId) {
      transaction = await this.transactionRepository.findOne({
        where: { razorpayOrderId, status: TransactionStatus.PENDING },
      });
    }

    if (transaction) {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.razorpayPaymentId = razorpayPaymentId;
      transaction.metadata = payment;
      await this.transactionRepository.save(transaction);
    }

    const order = await this.orderRepository.findOne({
      where: { razorpayOrderId },
    });

    if (order) {
      await this.ordersService.confirmPaidOrder(order.id, razorpayPaymentId);
    } else {
      this.logger.warn(
        `payment.captured: no order found for razorpayOrderId=${razorpayOrderId}`,
      );
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
    const paymentId = refund.payment_id;
    const transaction = await this.transactionRepository.findOne({
      where: { razorpayPaymentId: paymentId },
    });

    if (transaction) {
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

      await this.orderRepository.update(
        { id: transaction.orderId },
        { paymentStatus: PaymentStatus.REFUNDED },
      );
    }
  }

  /** Expire Razorpay orders stuck in pending_otp + payment pending after 30 minutes. */
  @Cron('*/5 * * * *', { timeZone: 'Asia/Kolkata' })
  async expireAbandonedRazorpayOrders() {
    const cutoff = new Date(Date.now() - RAZORPAY_ORDER_TTL_MS);

    const staleOrders = await this.orderRepository.find({
      where: {
        paymentMethod: PaymentMethod.RAZORPAY,
        status: OrderStatus.PENDING_OTP,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
    });

    if (staleOrders.length === 0) {
      return;
    }

    this.logger.log(`Expiring ${staleOrders.length} abandoned Razorpay order(s)`);

    for (const order of staleOrders) {
      await this.orderRepository.update(
        { id: order.id },
        {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
          cancellationReason: 'Payment abandoned — auto-expired after 30 minutes',
          cancelledAt: new Date(),
        },
      );

      if (order.razorpayOrderId) {
        await this.transactionRepository.update(
          {
            orderId: order.id,
            razorpayOrderId: order.razorpayOrderId,
            status: TransactionStatus.PENDING,
          },
          {
            status: TransactionStatus.FAILED,
            failureReason: 'Payment abandoned — auto-expired',
          },
        );
      }
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
