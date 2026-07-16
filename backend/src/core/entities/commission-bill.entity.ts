import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Shop } from './shop.entity';

export enum CommissionBillStatus {
  PENDING   = 'pending',
  PAID      = 'paid',
  OVERDUE   = 'overdue',
}

@Entity('commission_bills')
@Index(['shopId', 'billDate'])
@Index(['status', 'billDate'])
export class CommissionBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  shop: Shop;

  @Column()
  shopId: string;

  @Column({ type: 'date' })
  billDate: string;

  /** Saturday starting the Sat–Fri billing week; billDate is the ending Friday (due date). */
  @Column({ type: 'date', nullable: true })
  weekStartDate: string | null;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalOrderValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionPercent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  fineAmount: number;

  @Column({ type: 'int', default: 0 })
  daysOverdue: number;

  @Column({
    type: 'enum',
    enum: CommissionBillStatus,
    default: CommissionBillStatus.PENDING,
  })
  status: CommissionBillStatus;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true, type: 'timestamp' })
  paidAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  reminderSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
