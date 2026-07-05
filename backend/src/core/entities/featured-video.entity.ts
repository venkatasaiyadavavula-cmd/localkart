import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Shop } from './shop.entity';
import { Product } from './product.entity';

export enum FeaturedVideoStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

@Entity('featured_videos')
@Index(['status', 'expiresAt'])
@Index(['shopId', 'productId'])
export class FeaturedVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shopId: string;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column()
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ length: 500 })
  videoUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 29 })
  amount: number;

  @Column({ type: 'enum', enum: FeaturedVideoStatus, default: FeaturedVideoStatus.ACTIVE })
  status: FeaturedVideoStatus;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
