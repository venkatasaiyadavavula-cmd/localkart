import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Shop } from './shop.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { SponsoredProduct } from './sponsored-product.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum ProductCategoryType {
  GROCERIES = 'groceries',
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HOME_ESSENTIALS = 'home_essentials',
  BEAUTY = 'beauty',
  ACCESSORIES = 'accessories',
}

@Entity('products')
@Index(['shopId', 'status'])
@Index(['categoryId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ unique: true, length: 250 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  mrp: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ type: 'enum', enum: ProductCategoryType })
  categoryType: ProductCategoryType;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  videos: string[];

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, any>;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.PENDING })
  status: ProductStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ default: false })
  isSponsored: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  sponsoredUntil: Date;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  orderCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @ManyToOne(() => Shop, (shop) => shop.products, { onDelete: 'CASCADE' })
  shop: Shop;

  @Column()
  shopId: string;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => SponsoredProduct, (sponsored) => sponsored.product)
  sponsoredCampaigns: SponsoredProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
