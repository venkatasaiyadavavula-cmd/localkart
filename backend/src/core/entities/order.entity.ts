import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';
import { OrderItem } from './order-item.entity';
import { Transaction } from './transaction.entity';
import { ReturnRequest } from './return-request.entity';

export enum OrderStatus {
  PENDING_OTP = 'pending_otp',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned',
}

export enum PaymentMethod {
  COD = 'cod',
  RAZORPAY = 'razorpay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
@Index(['customerId', 'createdAt'])
@Index(['shopId', 'status'])
@Index(['orderNumber'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Shop, (shop) => shop.orders)
  shop: Shop;

  @Column()
  shopId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_OTP })
  status: OrderStatus;

  @Column({ type: 'jsonb' })
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };

  @Column({ nullable: true })
  deliveryOtp: string;

  @Column({ nullable: true })
  deliveryNotes: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true, type: 'timestamp' })
  confirmedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deliveredAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];

  @OneToOne(() => ReturnRequest, (returnRequest) => returnRequest.order)
  returnRequest: ReturnRequest;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
