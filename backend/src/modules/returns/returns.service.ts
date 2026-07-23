import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReturnRequest, ReturnStatus, ReturnReason } from '../../core/entities/return-request.entity';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { CreateReturnRequestDto, UpdateReturnStatusDto } from './dto/return-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { restoreDeliveredStatus } from '../orders/order-delivery.util';
import { getSignedUploadUrl, BUCKET_NAME } from '../../config/storage.config';
import { assertScopedResourceAccess } from '../../core/utils/scoped-access.util';
import razorpayInstance from '../../config/razorpay.config';

const REFUNDABLE_STATUSES: ReturnStatus[] = [ReturnStatus.APPROVED, ReturnStatus.PICKED_UP];

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    @InjectRepository(ReturnRequest)
    private readonly returnRepository: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createReturnRequest(userId: string, dto: CreateReturnRequestDto, files: Express.Multer.File[]) {
    const { orderId, reason, description } = dto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId: userId },
      relations: ['shop', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Return can only be requested for delivered orders');
    }

    // Check 24-hour window
    const deliveredAt = order.deliveredAt;
    if (!deliveredAt) {
      throw new BadRequestException('Order delivery time not recorded');
    }
    const hoursSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDelivery > 24) {
      throw new BadRequestException('Return window of 24 hours has expired');
    }

    // Check if return already exists
    const existingReturn = await this.returnRepository.findOne({
      where: { orderId },
    });
    if (existingReturn) {
      throw new BadRequestException('Return request already exists for this order');
    }

    // Upload evidence files
    const evidenceUrls: string[] = [];
    for (const file of files) {
      const key = `returns/${orderId}/${Date.now()}-${file.originalname}`;
      const uploadUrl = await getSignedUploadUrl(key, file.mimetype);
      // In production, you'd use the uploadUrl to upload and then store the final URL
      evidenceUrls.push(`https://${BUCKET_NAME}.s3.amazonaws.com/${key}`);
    }

    // Calculate refund amount (total amount minus delivery charge)
    const refundAmount = order.totalAmount - order.deliveryCharge;

    const returnRequest = this.returnRepository.create({
      orderId,
      customerId: userId,
      shopId: order.shopId,
      reason,
      description,
      evidenceImages: evidenceUrls.filter(u => u.match(/\.(jpg|jpeg|png|webp)$/i)),
      evidenceVideo: evidenceUrls.find(u => u.match(/\.(mp4|mov)$/i)),
      status: ReturnStatus.PENDING,
      refundAmount,
    });

    await this.returnRepository.save(returnRequest);

    // Update order status
    order.status = OrderStatus.RETURN_REQUESTED;
    await this.orderRepository.save(order);

    // Notify seller
    await this.notificationsService.sendSellerNotification(
      order.shop.ownerId,
      'New Return Request',
      `Customer has requested return for order #${order.orderNumber}`,
    );

    return returnRequest;
  }

  async getUserReturnRequests(userId: string, page: number, limit: number) {
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

  async getReturnRequestById(id: string, userId: string, role: UserRole | string, shopId?: string) {
    const request = await this.returnRepository.findOne({
      where: { id },
      relations: ['order', 'order.shop', 'customer'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    const sellerShopId =
      role === UserRole.SELLER ? await this.getShopIdByOwner(userId) : undefined;

    assertScopedResourceAccess(
      {
        customerId: request.customerId,
        shopId: request.shopId,
        shopOwnerId: request.order?.shop?.ownerId,
      },
      role,
      userId,
      { staffShopId: shopId, sellerShopId },
    );

    delete request.customer.password;
    return request;
  }

  async cancelReturnRequest(id: string, userId: string) {
    const request = await this.returnRepository.findOne({
      where: { id, customerId: userId },
      relations: ['order'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (request.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending return requests can be cancelled');
    }

    request.status = ReturnStatus.CANCELLED;
    await this.returnRepository.save(request);

    // Revert order status
    const order = request.order;
    restoreDeliveredStatus(order);
    await this.orderRepository.save(order);

    return { message: 'Return request cancelled' };
  }

  async getSellerPendingReturns(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const requests = await this.returnRepository.find({
      where: { shopId: shop.id, status: ReturnStatus.PENDING },
      relations: ['order', 'customer'],
      order: { createdAt: 'DESC' },
    });
    requests.forEach((r) => delete r.customer?.password);
    return requests;
  }

  async approveReturnRequest(id: string, ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const request = await this.returnRepository.findOne({
      where: { id, shopId: shop.id },
      relations: ['order', 'customer'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (request.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Request already processed');
    }

    request.status = ReturnStatus.APPROVED;
    await this.returnRepository.save(request);

    // Notify customer
    await this.notificationsService.sendCustomerNotification(
      request.customerId,
      'Return Request Approved',
      `Your return request for order #${request.order.orderNumber} has been approved.`,
    );

    delete request.customer?.password;
    return request;
  }

  async rejectReturnRequest(id: string, ownerId: string, reason: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const request = await this.returnRepository.findOne({
      where: { id, shopId: shop.id },
      relations: ['order'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (request.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Request already processed');
    }

    request.status = ReturnStatus.REJECTED;
    request.rejectionReason = reason;
    await this.returnRepository.save(request);

    // Revert order status
    const order = request.order;
    restoreDeliveredStatus(order);
    await this.orderRepository.save(order);

    // Notify customer
    await this.notificationsService.sendCustomerNotification(
      request.customerId,
      'Return Request Rejected',
      `Your return request was rejected. Reason: ${reason}`,
    );

    return request;
  }

  async schedulePickup(id: string, ownerId: string, body: { pickupDate: string; pickupAddress: string; contactPhone: string }) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const request = await this.returnRepository.findOne({
      where: { id, shopId: shop.id, status: ReturnStatus.APPROVED },
    });

    if (!request) {
      throw new NotFoundException('Approved return request not found');
    }

    request.status = ReturnStatus.PICKUP_SCHEDULED;
    request.pickupScheduledAt = new Date(body.pickupDate);
    request.pickupAddress = body.pickupAddress;
    request.pickupContactPhone = body.contactPhone;
    await this.returnRepository.save(request);

    // Notify customer
    await this.notificationsService.sendCustomerNotification(
      request.customerId,
      'Return Pickup Scheduled',
      `Pickup scheduled for ${body.pickupDate}. Contact: ${body.contactPhone}`,
    );

    return request;
  }

  async confirmPickup(id: string, ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const request = await this.returnRepository.findOne({
      where: { id, shopId: shop.id, status: ReturnStatus.PICKUP_SCHEDULED },
      relations: ['order', 'order.items'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found or not scheduled');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update return status
      request.status = ReturnStatus.PICKED_UP;
      await queryRunner.manager.save(request);

      // Restore product stock
      const order = request.order;
      for (const item of order.items) {
        await queryRunner.manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }

      await queryRunner.commitTransaction();

      // Notify admin for refund processing
      await this.notificationsService.sendAdminNotification(
        'Return Pickup Confirmed',
        `Order #${order.orderNumber} return pickup confirmed. Refund pending.`,
      );

      return request;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllReturnRequests(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

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

  async adminUpdateReturnStatus(id: string, dto: UpdateReturnStatusDto) {
    const request = await this.returnRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    request.status = dto.status;
    if (dto.notes) {
      request.rejectionReason = dto.notes;
    }
    await this.returnRepository.save(request);

    return request;
  }

  async processRefund(id: string) {
    const request = await this.returnRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (!REFUNDABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException(
        'Return request not ready for refund (must be approved or picked up)',
      );
    }

    const order = request.order;

    if (
      order.paymentMethod === PaymentMethod.RAZORPAY &&
      order.paymentStatus === PaymentStatus.PAID
    ) {
      if (!order.razorpayPaymentId) {
        throw new BadRequestException('Order has no Razorpay payment ID for refund');
      }
      await this.initiateRazorpayRefund(order.razorpayPaymentId, request.refundAmount, {
        returnRequestId: request.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    order.status = OrderStatus.RETURNED;
    order.paymentStatus = PaymentStatus.REFUNDED;
    await this.orderRepository.save(order);

    request.status = ReturnStatus.REFUNDED;
    request.resolvedAt = new Date();
    await this.returnRepository.save(request);

    await this.notificationsService.sendCustomerNotification(
      request.customerId,
      'Refund Processed',
      `Refund of ₹${request.refundAmount} for order #${order.orderNumber} has been initiated.`,
    );

    return { message: 'Refund processed successfully' };
  }

  private async initiateRazorpayRefund(
    razorpayPaymentId: string,
    amountRupees: number,
    notes: Record<string, string>,
  ): Promise<void> {
    const amountPaise = Math.round(Number(amountRupees) * 100);
    try {
      await razorpayInstance.payments.refund(razorpayPaymentId, {
        amount: amountPaise,
        notes,
      });
    } catch (error: any) {
      const description = error?.error?.description || error?.message || 'Unknown error';
      this.logger.error(`Razorpay refund failed for ${razorpayPaymentId}: ${description}`);
      throw new BadGatewayException(`Razorpay refund failed: ${description}`);
    }
  }

  private async getShopIdByOwner(ownerId: string): Promise<string> {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    return shop?.id;
  }
}
