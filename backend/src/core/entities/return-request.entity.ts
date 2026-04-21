import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKED_UP = 'picked_up',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  DAMAGED = 'damaged',
  NOT_AS_DESCRIBED = 'not_as_described',
  OTHER = 'other',
}

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (order) => order.returnRequest)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => User, (user) => user.returnRequests)
  customer: User;

  @Column()
  customerId: string;

  @Column()
  shopId: string;

  @Column({ type: 'enum', enum: ReturnReason })
  reason: ReturnReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  evidenceImages: string[];

  @Column({ nullable: true })
  evidenceVideo: string;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
  status: ReturnStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  refundAmount: number;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  pickupAddress: string;

  @Column({ nullable: true, type: 'timestamp' })
  pickupScheduledAt: Date;

  @Column({ nullable: true })
  pickupContactPhone: string;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
