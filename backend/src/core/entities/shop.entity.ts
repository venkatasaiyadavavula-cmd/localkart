import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { Subscription } from './subscription.entity';

export enum ShopStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum ManualOverride {
  NONE = 'none',
  FORCE_OPEN = 'force_open',
  FORCE_CLOSED = 'force_closed',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 10 })
  pincode: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  bannerImage: string;

  @Column({ nullable: true })
  logoImage: string;

  @Column({ length: 15 })
  contactPhone: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ nullable: true, length: 100 })
  contactEmail: string;

  @Column({ type: 'enum', enum: ShopStatus, default: ShopStatus.PENDING })
  status: ShopStatus;

  @Column({ default: 0 })
  totalProducts: number;

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ type: 'time', nullable: true })
  openingTime: string;

  @Column({ type: 'time', nullable: true })
  closingTime: string;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: Record<string, { open: string; close: string; isOpen: boolean }>;

  @Column({
    type: 'enum',
    enum: ManualOverride,
    default: ManualOverride.FORCE_CLOSED,
  })
  manualOverride: ManualOverride;

  @Column({ type: 'timestamp', nullable: true })
  manualOverrideSetAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  deliveryPincodes: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freeDeliveryAbove: number;

  @Column({ nullable: true })
  fssaiLicense: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panCard: string;

  @OneToOne(() => User, (user) => user.shop)
  @JoinColumn()
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];

  @OneToMany(() => Order, (order) => order.shop)
  orders: Order[];

  @OneToMany(() => Subscription, (subscription) => subscription.shop)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
