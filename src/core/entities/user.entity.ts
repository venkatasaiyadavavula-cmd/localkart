import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Shop } from './shop.entity';
import { Order } from './order.entity';
import { ReturnRequest } from './return-request.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 15 })
  phone: string;

  @Column({ nullable: true, unique: true, length: 100 })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, length: 255 })
  address: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  lastOtp: string;

  @Column({ nullable: true, type: 'timestamp' })
  lastOtpSentAt: Date;

  @OneToOne(() => Shop, (shop) => shop.owner)
  shop: Shop;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => ReturnRequest, (returnRequest) => returnRequest.customer)
  returnRequests: ReturnRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
