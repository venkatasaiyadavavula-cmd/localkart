import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AddressType {
  HOME  = 'home',
  WORK  = 'work',
  OTHER = 'other',
}

@Entity('saved_addresses')
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.HOME })
  type: AddressType;

  @Column()
  label: string;

  @Column()
  fullAddress: string;

  @Column({ nullable: true })
  landmark: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
