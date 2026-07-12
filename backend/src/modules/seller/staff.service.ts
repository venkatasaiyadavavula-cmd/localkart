import {
  Injectable, BadRequestException, ForbiddenException,
  NotFoundException, ConflictException, Logger, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StaffMember, StaffRole, StaffStatus } from '../../core/entities/staff-member.entity';
import { Shop } from '../../core/entities/shop.entity';
import { MAX_STAFF, ROLE_PERMISSIONS } from './staff-permissions';

export { MAX_STAFF, ROLE_PERMISSIONS };

/** Permanent E2E staff account — Playwright tests log in with this ID/password. */
export const E2E_STAFF_ID = 'qa_test_worker';
export const E2E_STAFF_PASSWORD = 'Test@1234';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepo: Repository<StaffMember>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly jwtService: JwtService,
  ) {}

  async getStaff(ownerId: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.find({
      where: { shopId: shop.id },
      order: { createdAt: 'DESC' },
      select: ['id','name','phone','staffId','role','status','lastLoginAt','note','createdAt'],
    });

    return staff.map(s => ({
      ...s,
      permissions: ROLE_PERMISSIONS[s.role],
      isOnline: s.lastLoginAt
        ? (Date.now() - new Date(s.lastLoginAt).getTime()) < 30 * 60 * 1000
        : false,
    }));
  }

  async addStaff(ownerId: string, dto: {
    name: string;
    phone: string;
    role?: StaffRole;
    note?: string;
    staffId?: string;
    password?: string;
  }) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const count = await this.staffRepo.count({ where: { shopId: shop.id, status: StaffStatus.ACTIVE } });
    if (count >= MAX_STAFF) {
      throw new BadRequestException(`Maximum ${MAX_STAFF} team members allowed per shop`);
    }

    const existingPhone = await this.staffRepo.findOne({ where: { phone: dto.phone } });
    if (existingPhone) throw new ConflictException('Phone number already used');

    const role = dto.role ?? StaffRole.WORKER;

    let staffId = dto.staffId?.trim().toLowerCase();
    if (!staffId) {
      const shopCode = shop.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'LK';
      const suffix = Math.floor(1000 + Math.random() * 9000);
      staffId = `lk-${shopCode.toLowerCase()}-${suffix}`;
    } else {
      if (!/^[a-z0-9._+-]{4,30}$/.test(staffId)) {
        throw new BadRequestException('Login ID must be 4–30 characters (letters, numbers, _ . + -)');
      }
    }

    const existingId = await this.staffRepo.findOne({ where: { staffId } });
    if (existingId) throw new ConflictException('Login ID already taken. Choose another.');

    const password = dto.password?.trim() || `${dto.name.substring(0, 3).toLowerCase()}${dto.phone.slice(-4)}`;
    if (password.length < 4) {
      throw new BadRequestException('Password must be at least 4 characters');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = this.staffRepo.create({
      shopId: shop.id,
      name: dto.name,
      phone: dto.phone,
      role,
      staffId,
      passwordHash,
      note: dto.note,
      status: StaffStatus.ACTIVE,
    });

    await this.staffRepo.save(staff);

    this.logger.log(`Staff added: ${staffId} (${role}) to shop ${shop.name}`);

    return {
      id: staff.id,
      name: staff.name,
      phone: staff.phone,
      staffId: staff.staffId,
      role: staff.role,
      permissions: ROLE_PERMISSIONS[staff.role],
      tempPassword: password,
      message: 'Share these login credentials with your team member.',
    };
  }

  async updateStaff(ownerId: string, staffMemberId: string, dto: {
    role?: StaffRole; note?: string;
  }) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    if (dto.role) staff.role = dto.role;
    if (dto.note !== undefined) staff.note = dto.note;

    await this.staffRepo.save(staff);

    return { ...staff, permissions: ROLE_PERMISSIONS[staff.role] };
  }

  async removeStaff(ownerId: string, staffMemberId: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    staff.status = StaffStatus.INACTIVE;
    await this.staffRepo.save(staff);

    this.logger.log(`Staff deactivated: ${staff.staffId} from shop ${shop.name}`);
    return {
      success: true,
      message: `${staff.name} (@${staff.staffId}) has been removed. They can no longer log in to work.`,
      removedStaffId: staff.staffId,
      removedName: staff.name,
    };
  }

  async resetPassword(ownerId: string, staffMemberId: string, newPassword?: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const password =
      staff.staffId === E2E_STAFF_ID
        ? E2E_STAFF_PASSWORD
        : newPassword?.trim() || `${staff.name.substring(0, 3).toLowerCase()}${Date.now().toString().slice(-4)}`;
    staff.passwordHash = await bcrypt.hash(password, 10);
    await this.staffRepo.save(staff);

    return { success: true, staffId: staff.staffId, newPassword: password, message: 'Password reset. Share with team member.' };
  }

  async staffLogin(staffId: string, password: string) {
    const staff = await this.staffRepo.findOne({
      where: { staffId: staffId.trim().toLowerCase(), status: StaffStatus.ACTIVE },
      relations: ['shop'],
    });

    if (!staff) throw new UnauthorizedException('Invalid Login ID or account inactive');

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid password');

    staff.lastLoginAt = new Date();
    await this.staffRepo.save(staff);

    const permissions = ROLE_PERMISSIONS[staff.role];

    const token = this.jwtService.sign({
      sub: staff.id,
      staffId: staff.staffId,
      shopId: staff.shopId,
      role: 'staff',
      staffRole: staff.role,
      permissions,
      typ: 'access',
    });

    return {
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        staffId: staff.staffId,
        role: staff.role,
        shopName: staff.shop.name,
        permissions,
      },
    };
  }
}
