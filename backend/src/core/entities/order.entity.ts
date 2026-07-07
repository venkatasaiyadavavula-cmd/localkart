import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User }      from './user.entity';
import { Shop }      from './shop.entity';
import { OrderItem } from './order-item.entity';
import { Transaction } from './transaction.entity';

export enum OrderStatus {
  PENDING_OTP      = 'pending_otp',
  CONFIRMED        = 'confirmed',
  PROCESSING       = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED        = 'delivered',
  CANCELLED        = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURNED         = 'returned',
}

export enum PaymentMethod {
  COD      = 'cod',
  RAZORPAY = 'razorpay',
  WALLET   = 'wallet',
}

export enum PaymentStatus {
  PENDING  = 'pending',
  PAID     = 'paid',
  FAILED   = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
@Index(['customerId', 'status'])
@Index(['shopId', 'status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  orderNumber: string;

  @Column()
  customerId: string;

  @ManyToOne(() => User, u => u.orders)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  shopId: string;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @OneToMany(() => OrderItem, i => i.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Transaction, t => t.order)
  transactions: Transaction[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'commissionRate' })
  commissionPercent: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_OTP })
  status: OrderStatus;

  @Column({ type: 'jsonb', name: 'shippingAddress' })
  deliveryAddress: Record<string, any>;

  @Column({ nullable: true })
  deliveryOtp: string;

  @Column({ nullable: true })
  deliveryNotes: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  /* ── Live tracking columns ─────────────────────────── */
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLongitude: number | null;

  @Column({ nullable: true, type: 'timestamp' })
  locationUpdatedAt: Date | null;

  @Column({ nullable: true, length: 100 })
  deliveryStaffName: string | null;

  @Column({ nullable: true, length: 15 })
  deliveryStaffPhone: string | null;
  /* ─────────────────────────────────────────────────── */

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date;
}
