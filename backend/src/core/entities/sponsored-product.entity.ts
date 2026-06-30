import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Shop } from './shop.entity';

export enum AdStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum AdType {
  SPONSORED = 'sponsored',
  VIDEO = 'video',
}

@Entity('sponsored_products')
@Index(['productId', 'status'])
@Index(['shopId'])
export class SponsoredProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.sponsoredCampaigns, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => Shop)
  shop: Shop;

  @Column()
  shopId: string;

  @Column({ type: 'enum', enum: AdType })
  adType: AdType;

  @Column({ type: 'enum', enum: AdStatus, default: AdStatus.PENDING })
  status: AdStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPerDay: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ default: 0 })
  impressions: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ type: 'jsonb', nullable: true })
  targeting: {
    pincodes?: string[];
    categories?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
