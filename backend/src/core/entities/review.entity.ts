import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, Index, Check,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';

@Entity('reviews')
@Index(['productId', 'customerId'], { unique: true })
@Check('"rating" >= 1 AND "rating" <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  customer: User;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  order: Order;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @Column({ default: 0 })
  helpfulCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
