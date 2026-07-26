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

@Entity('product_variants')
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  productId: string;

  /** e.g. { color: "Red", size: "L" } */
  @Column({ type: 'jsonb' })
  attributes: Record<string, string>;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  priceOverride: number | null;

  @Column({ nullable: true })
  sku: string | null;

  @Column({ nullable: true })
  image: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
