import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shop } from './shop.entity';
import { Product } from './product.entity';

@Entity('daily_offers')
export class DailyOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shopId: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  offerPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  originalPrice: number;

  @Column({ type: 'int' })
  discountPercentage: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
