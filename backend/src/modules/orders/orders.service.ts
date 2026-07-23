import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../core/entities/order.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../core/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';
import { OrderStateMachine } from './workflows/order-state-machine';
import { TrackingGateway } from './tracking.gateway';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LocationService } from '../location/location.service';
import { CommissionRatesService } from '../catalog/commission-rates.service';
import { markOrderDelivered } from './order-delivery.util';
import { ProductCategoryType } from '../../core/entities/product.entity';
import { FALLBACK_COMMISSION_RATE } from '../../core/constants/commission-rates.constant';
import { generateOrderNumber, generateOtp } from '../../core/utils/helpers';
import { isShopCurrentlyOpen, getShopHoursStatus } from '../../core/utils/shop-hours.util';
import { assertScopedResourceAccess } from '../../core/utils/scoped-access.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
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
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ReturnRequest)
    private readonly returnRepository: Repository<ReturnRequest>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
    private readonly stateMachine: OrderStateMachine,
    private readonly notificationsService: NotificationsService,
    private readonly trackingGateway: TrackingGateway,
    private readonly locationService: LocationService,
    private readonly commissionRatesService: CommissionRatesService,
  ) {}

  private formatOrderResponse(order: Order) {
    if (!order) return order;
    const { deliveryAddress, ...rest } = order as Order & { shippingAddress?: unknown };
    return {
      ...rest,
      deliveryAddress,
      shippingAddress: deliveryAddress,
    };
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { paymentMethod = PaymentMethod.COD, shippingAddress, deliveryNotes } = createOrderDto;

    if (paymentMethod === PaymentMethod.RAZORPAY && process.env.PAYMENTS_ENABLED !== 'true') {
      throw new BadRequestException('Online payment is not available. Please use Cash on Delivery.');
    }

    const { cart, products } = await this.cartService.validateCartForCheckout(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const shopId = cart.items[0].shopId;
    const shop = await this.shopRepository.findOne({
      where: { id: shopId, status: ShopStatus.APPROVED },
    });
    if (!shop) {
      throw new BadRequestException('Shop is not available');
    }

    const isOpen = isShopCurrentlyOpen(shop);
    const hoursStatus = getShopHoursStatus(shop);

    if (!isOpen) {
      throw new BadRequestException('Shop is currently closed');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = this.locationService.resolveDeliveryCharge(
      shop,
      shippingAddress?.latitude,
      shippingAddress?.longitude,
      subtotal,
    );
    const totalAmount = subtotal + deliveryCharge;

    const ratesMap = await this.commissionRatesService.getRatesMap();
    const commissionRate = this.calculateCommissionRate(products, ratesMap);
    const commissionAmount = (subtotal * commissionRate) / 100;

    const orderNumber = generateOrderNumber();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.orderRepository.create({
        orderNumber,
        customerId: userId,
        shopId,
        subtotal,
        totalAmount,
        deliveryCharge,
        finalAmount: totalAmount,
        commissionPercent: commissionRate,
        commissionAmount,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.PENDING_OTP,
        deliveryAddress: shippingAddress,
        deliveryNotes,
        deliveryOtp: generateOtp(),
      });

      const savedOrder = await queryRunner.manager.save(order);

      const isCod = paymentMethod === PaymentMethod.COD;

      for (const item of cart.items) {
        const lockedProduct = await queryRunner.manager
          .getRepository(Product)
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id: item.productId })
          .getOne();

        if (!lockedProduct) {
          throw new BadRequestException(`Product ${item.name} is no longer available`);
        }
        if (lockedProduct.stock < item.quantity) {
          throw new BadRequestException(
            `Only ${lockedProduct.stock} of ${item.name} available`,
          );
        }

        const itemCommissionRate = this.getProductCommissionRate(lockedProduct, ratesMap);
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          pricePerUnit: item.price,
          totalPrice: item.price * item.quantity,
          commissionRate: itemCommissionRate,
          commissionAmount: (item.price * item.quantity * itemCommissionRate) / 100,
        });
        await queryRunner.manager.save(orderItem);

        if (isCod) {
          lockedProduct.stock -= item.quantity;
          lockedProduct.orderCount += 1;
          await queryRunner.manager.save(lockedProduct);
        }
      }

      if (isCod) {
        shop.totalOrders += 1;
        await queryRunner.manager.save(shop);
        await this.cartService.clearCart(userId);
      }

      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Order OTP generated for ${orderNumber}`);
      }
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

      // WhatsApp: scam-warning notification to customer (3 languages)
      if (fullOrder.customer?.phone) {
        const itemsSummary = fullOrder.items
          .slice(0, 2)
          .map((i) => i.productName)
          .join(', ') + (fullOrder.items.length > 2 ? ` +${fullOrder.items.length - 2} more` : '');

        this.notificationsService.sendOrderPlacedWhatsApp(
          fullOrder.customer.phone,
          fullOrder.customer.name,
          fullOrder.orderNumber,
          fullOrder.shop.name,
          fullOrder.totalAmount,
          fullOrder.paymentMethod as 'cod' | 'razorpay',
        ).catch((e) => this.logger.error('WhatsApp customer failed: ' + e.message));

        // WhatsApp: new order alert to seller
        this.notificationsService.sendNewOrderWhatsApp(
          fullOrder.shop.contactPhone,
          fullOrder.shop.name,
          fullOrder.orderNumber,
          itemsSummary,
          fullOrder.totalAmount,
        ).catch((e) => this.logger.error('WhatsApp seller failed: ' + e.message));
      }

      return {
        ...this.formatOrderResponse(fullOrder),
        isShopOpen: isOpen,
        shopClosedMessage: null,
        shopStatusMessage: hoursStatus.statusMessage,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Order creation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create order: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private calculateCommissionRate(
    products: Product[],
    ratesMap: Record<ProductCategoryType, number>,
  ): number {
    const rates = products.map((p) => this.getProductCommissionRate(p, ratesMap));
    return rates.length ? Math.max(...rates) : FALLBACK_COMMISSION_RATE;
  }

  private getProductCommissionRate(
    product: Product,
    ratesMap: Record<ProductCategoryType, number>,
  ): number {
    return ratesMap[product.categoryType] ?? FALLBACK_COMMISSION_RATE;
  }

  async verifyDeliveryOtp(orderId: string, otp: string, currentUser: any) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['shop', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new ForbiddenException('You can only verify OTP for your own orders');
    }
    if (currentUser.role === UserRole.SELLER && order.shop.ownerId !== currentUser.id) {
      throw new ForbiddenException('You can only verify OTP for your shop orders');
    }

    if (order.deliveryOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      if (order.status === OrderStatus.PENDING_OTP) {
        order.status = OrderStatus.CONFIRMED;
        order.confirmedAt = new Date();
        order.deliveryOtp = null;
      } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        markOrderDelivered(order);
      } else {
        throw new BadRequestException('Order is not ready for OTP verification');
      }
    } else if (currentUser.role === UserRole.SELLER) {
      if (order.status !== OrderStatus.PENDING_OTP) {
        throw new BadRequestException('Order is not pending OTP');
      }
      order.status = OrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.deliveryOtp = null;
    }

    await this.orderRepository.save(order);

    this.trackingGateway.emitStatusUpdate(orderId, { status: order.status });

    delete order.customer?.password;
    return { message: 'OTP verified successfully', order };
  }

  async getUserOrders(userId: string, page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { customerId: userId };
    if (status) where.status = status;

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['items', 'shop'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    orders.forEach((o) => delete o.deliveryOtp);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderById(id: string, userId: string, role: UserRole | string, shopId?: string) {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(id)) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'shop', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    assertScopedResourceAccess(
      {
        customerId: order.customerId,
        shopId: order.shopId,
        shopOwnerId: order.shop?.ownerId,
      },
      role,
      userId,
      { staffShopId: shopId },
    );

    delete order.deliveryOtp;
    delete order.customer.password;

    const returnRequest = await this.returnRepository.findOne({
      where: { orderId: id },
      select: ['id', 'status', 'reason', 'createdAt'],
    });

    return this.formatOrderResponse({
      ...order,
      returnRequest: returnRequest ?? undefined,
    } as Order & { returnRequest?: ReturnRequest });
  }

  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId: userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.stateMachine.canTransition(order.status, OrderStatus.CANCELLED)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        await queryRunner.manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = reason || 'Customer cancelled';

      if (order.paymentMethod === PaymentMethod.RAZORPAY && order.paymentStatus === PaymentStatus.PAID) {
        order.paymentStatus = PaymentStatus.PENDING;
      }

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      this.trackingGateway.emitStatusUpdate(orderId, { status: OrderStatus.CANCELLED });

      delete order.deliveryOtp;
      return { message: 'Order cancelled successfully', order };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSellerOrders(sellerId: string, page: number, limit: number, status?: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: sellerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const skip = (page - 1) * limit;
    const where: any = { shopId: shop.id };
    if (status) where.status = status;

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

  async updateOrderStatusBySeller(
    orderId: string,
    sellerId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: sellerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, shopId: shop.id },
      relations: ['shop'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const { status, notes } = updateDto;

    if (status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Delivered status can only be set via customer OTP verification. Ask the customer for their delivery OTP.',
      );
    }

    if (!this.stateMachine.canTransition(order.status, status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      order.deliveryOtp = order.deliveryOtp || generateOtp();
      if (!order.deliveryLatitude && order.shop?.latitude) {
        order.deliveryLatitude = Number(order.shop.latitude);
        order.deliveryLongitude = Number(order.shop.longitude);
        order.locationUpdatedAt = new Date();
      }
      if (!order.deliveryStaffName) {
        order.deliveryStaffName = 'Delivery Partner';
      }
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Delivery OTP generated for order ${order.orderNumber}`);
      }
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

    // WhatsApp status update to customer
    const fullOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer'],
    });
    if (fullOrder?.customer?.phone) {
      this.notificationsService.sendOrderStatusWhatsApp(
        fullOrder.customer.phone,
        fullOrder.customer.name,
        order.orderNumber,
        status,
      ).catch((e) => this.logger.error('WhatsApp status update failed: ' + e.message));
    }

    delete order.deliveryOtp;
    return order;
  }

  async updateDeliveryLocation(
    orderId: string,
    sellerId: string,
    dto: UpdateDeliveryLocationDto,
  ) {
    const shop = await this.shopRepository.findOne({ where: { ownerId: sellerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, shopId: shop.id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Location updates allowed only during delivery');
    }

    order.deliveryLatitude = dto.latitude;
    order.deliveryLongitude = dto.longitude;
    order.locationUpdatedAt = new Date();
    if (dto.staffName) order.deliveryStaffName = dto.staffName;
    if (dto.staffPhone) order.deliveryStaffPhone = dto.staffPhone;

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

  async adminUpdateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const status = dto.status;
    if (status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Delivered status can only be set via customer OTP verification.',
      );
    }

    if (!this.stateMachine.canTransition(order.status, status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    return this.orderRepository.save(order);
  }

  async getAllOrders(page: number, limit: number, status?: string, shopId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;

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

  async trackOrderByNumber(orderNumber: string) {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['shop'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      estimatedDelivery: order.status === OrderStatus.OUT_FOR_DELIVERY ? 'Today' : 'Processing',
      shop: {
        name: order.shop.name,
        phone: order.shop.contactPhone,
      },
    };
  }

  async confirmPaidOrder(internalOrderId: string, razorpayPaymentId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: internalOrderId },
      relations: ['items', 'shop'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      delete order.deliveryOtp;
      delete order.customer?.password;
      return order;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
        await queryRunner.manager.increment(
          Product,
          { id: item.productId },
          'orderCount',
          item.quantity,
        );
      }

      await queryRunner.manager.increment(Shop, { id: order.shopId }, 'totalOrders', 1);

      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.razorpayPaymentId = razorpayPaymentId;

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      await this.cartService.clearCart(order.customerId);

      delete order.deliveryOtp;
      delete order.customer?.password;
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateRazorpayOrderId(internalOrderId: string, razorpayOrderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: internalOrderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.razorpayOrderId === razorpayOrderId) {
      const existingTxn = await this.transactionRepository.findOne({
        where: {
          orderId: internalOrderId,
          razorpayOrderId,
          status: TransactionStatus.PENDING,
        },
      });
      if (existingTxn) {
        return;
      }
    }

    await this.orderRepository.update(
      { id: internalOrderId },
      {
        paymentStatus: PaymentStatus.PENDING,
        razorpayOrderId,
      },
    );

    const transaction = this.transactionRepository.create({
      orderId: internalOrderId,
      razorpayOrderId,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      amount: order.totalAmount,
      currency: 'INR',
    });
    await this.transactionRepository.save(transaction);
  }
}
