import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shop } from './shop.entity';
import { Product } from './product.entity';

@Entity('daily_offers')
export class DailyOffer {
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

  @Column('decimal', { precision: 12, scale: 2 })
  offerPrice: number;

  @Column('decimal', { precision: 12, scale: 2 })
  originalPrice: number;

  @Column('int')
  discountPercentage: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
