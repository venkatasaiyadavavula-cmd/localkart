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
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStateMachine } from './workflows/order-state-machine';
import { CartService } from '../cart/cart.service';
import { generateOrderNumber, generateOtp } from '../../core/utils/helpers';

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
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  /**
   * షాపు ప్రస్తుతం తెరిచి ఉందో లేదో చెక్ చేస్తుంది
   */
  private isShopOpen(shop: Shop): boolean {
    if (!shop.openingTime || !shop.closingTime) {
      return true; // టైమింగ్స్ సెట్ చేయకపోతే 24/7 ఓపెన్ అని అనుకుంటాం
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMinute] = shop.openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = shop.closingTime.split(':').map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * తదుపరి షాపు తెరిచే సమయాన్ని లెక్కిస్తుంది
   */
  private getNextOpeningTime(shop: Shop): string {
    if (!shop.openingTime) return 'tomorrow morning';
    
    const now = new Date();
    const [openHour, openMinute] = shop.openingTime.split(':').map(Number);
    const nextOpen = new Date(now);
    
    if (now.getHours() > openHour || (now.getHours() === openHour && now.getMinutes() >= openMinute)) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    nextOpen.setHours(openHour, openMinute, 0, 0);
    
    return nextOpen.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { paymentMethod = PaymentMethod.COD, shippingAddress, deliveryNotes } = createOrderDto;

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

    const isOpen = this.isShopOpen(shop);
    const nextOpeningTime = this.getNextOpeningTime(shop);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = subtotal >= shop.freeDeliveryAbove ? 0 : shop.deliveryCharge;
    const totalAmount = subtotal + deliveryCharge;

    const commissionRate = this.calculateCommissionRate(products);
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
        deliveryCharge,
        totalAmount,
        commissionRate,
        commissionAmount,
        paymentMethod,
        paymentStatus: paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
        status: OrderStatus.PENDING_OTP,
        shippingAddress,
        deliveryNotes,
        deliveryOtp: generateOtp(),
      });

      const savedOrder = await queryRunner.manager.save(order);

      for (const item of cart.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;

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

        product.stock -= item.quantity;
        product.orderCount += 1;
        await queryRunner.manager.save(product);
      }

      shop.totalOrders += 1;
      await queryRunner.manager.save(shop);

      await this.cartService.clearCart(userId);

      this.logger.log(`Order OTP for ${orderNumber}: ${savedOrder.deliveryOtp}`);

      await queryRunner.commitTransaction();

      const fullOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'shop', 'customer'],
      });

      delete fullOrder.deliveryOtp;
      delete fullOrder.customer.password;

      return {
        ...fullOrder,
        isShopOpen: isOpen,
        shopClosedMessage: isOpen ? null : `Shop is currently closed. Your order will be processed after ${nextOpeningTime}.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Order creation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create order: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private calculateCommissionRate(products: Product[]): number {
    const rates = products.map((p) => this.getProductCommissionRate(p));
    return Math.max(...rates);
  }

  private getProductCommissionRate(product: Product): number {
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
      if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
        throw new BadRequestException('Order is not out for delivery');
      }
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      order.paymentStatus = PaymentStatus.PAID;
      order.deliveryOtp = null;
    } else if (currentUser.role === UserRole.SELLER) {
      if (order.status !== OrderStatus.PENDING_OTP) {
        throw new BadRequestException('Order is not pending OTP');
      }
      order.status = OrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.deliveryOtp = null;
    }

    await this.orderRepository.save(order);

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

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderById(id: string, userId: string, role: UserRole) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'shop', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.CUSTOMER && order.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === UserRole.SELLER && order.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    delete order.deliveryOtp;
    delete order.customer.password;

    return order;
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
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const { status, notes } = updateDto;

    if (!this.stateMachine.canTransition(order.status, status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    if (status === OrderStatus.OUT_FOR_DELIVERY && order.paymentMethod === PaymentMethod.COD) {
      order.deliveryOtp = generateOtp();
      this.logger.log(`Delivery OTP for order ${order.orderNumber}: ${order.deliveryOtp}`);
    }
    if (notes) {
      order.deliveryNotes = notes;
    }

    await this.orderRepository.save(order);
    return order;
  }

  async adminUpdateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const { status } = updateDto;
    if (!this.stateMachine.canTransition(order.status, status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    await this.orderRepository.save(order);
    return order;
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
    const order = await this.orderRepository.findOne({ where: { id: internalOrderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();

    await this.orderRepository.save(order);
    return order;
  }

  async updateRazorpayOrderId(internalOrderId: string, razorpayOrderId: string) {
    await this.orderRepository.update(
      { id: internalOrderId },
      { paymentStatus: PaymentStatus.PENDING } as any,
    );
    const transaction = this.transactionRepository.create({
      orderId: internalOrderId,
      razorpayOrderId,
      type: 'payment',
      status: 'pending',
      amount: 0,
      currency: 'INR',
    });
    await this.transactionRepository.save(transaction);
  }
}
