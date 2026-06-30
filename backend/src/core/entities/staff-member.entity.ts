import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, Index,
} from 'typeorm';
import { Shop } from './shop.entity';

export enum StaffRole {
  PRODUCTS_MANAGER = 'products_manager',
  DELIVERY_STAFF   = 'delivery_staff',
  STORE_MANAGER    = 'store_manager',
}

export enum StaffStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
}

@Entity('staff_members')
@Index(['shopId', 'status'])
@Index(['staffId', 'shopId'], { unique: true })
export class StaffMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  shop: Shop;

  @Column()
  shopId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 15, unique: true })
  phone: string;

  @Column({ length: 30, unique: true })
  staffId: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status: StaffStatus;

  @Column({ nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @Column({ nullable: true, length: 500 })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
