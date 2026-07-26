import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Shop } from './shop.entity';
import { CommissionBill } from './commission-bill.entity';

@Entity('ad_campaign_charges')
@Index(['shopId', 'createdAt'])
@Index(['commissionBillId'])
export class AdCampaignCharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  shop: Shop;

  @Column()
  shopId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  /** Sponsored product campaign row, when applicable */
  @Column({ type: 'uuid', nullable: true })
  sponsoredProductId: string | null;

  /** Featured homepage video row, when applicable */
  @Column({ type: 'uuid', nullable: true })
  featuredVideoId: string | null;

  @ManyToOne(() => CommissionBill, { onDelete: 'SET NULL', nullable: true })
  commissionBill: CommissionBill | null;

  @Column({ type: 'uuid', nullable: true })
  commissionBillId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
