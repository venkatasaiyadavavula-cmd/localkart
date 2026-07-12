import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { Review } from './review.entity';
import { User } from './user.entity';

@Entity('review_helpful_votes')
@Index(['reviewId', 'userId'], { unique: true })
export class ReviewHelpfulVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reviewId: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  review: Review;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
