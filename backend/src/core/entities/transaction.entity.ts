import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  SETTLEMENT = 'settlement',
  COMMISSION = 'commission',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
@Index(['orderId'])
@Index(['razorpayPaymentId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.transactions, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpaySignature: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
