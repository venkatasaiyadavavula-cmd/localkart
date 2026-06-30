import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

@Entity('wishlists')
@Index(['userId', 'productId'], { unique: true })
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @CreateDateColumn()
  savedAt: Date;
}
