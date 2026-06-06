import {
  Injectable, BadRequestException, ForbiddenException,
  NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StaffMember, StaffRole, StaffStatus } from '../../core/entities/staff-member.entity';
import { Shop } from '../../core/entities/shop.entity';

const MAX_STAFF = 10;

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  [StaffRole.STORE_MANAGER]:    ['products:read','products:write','orders:read','orders:write','inventory:write'],
  [StaffRole.PRODUCTS_MANAGER]: ['products:read','products:write','inventory:write'],
  [StaffRole.DELIVERY_STAFF]:   ['orders:read','orders:write'],
};

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

  // ── List all staff for a shop ────────────────────────────
  async getStaff(shopId: string) {
    const staff = await this.staffRepo.find({
      where: { shopId },
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

  // ── Add new staff member ─────────────────────────────────
  async addStaff(ownerId: string, dto: {
    name: string; phone: string; role: StaffRole; note?: string;
  }) {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const count = await this.staffRepo.count({ where: { shopId: shop.id, status: StaffStatus.ACTIVE } });
    if (count >= MAX_STAFF) throw new BadRequestException(`Maximum ${MAX_STAFF} staff members allowed`);

    const existing = await this.staffRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already used');

    // Generate staff ID: LK-SHOPCODE-XXXX
    const shopCode = shop.name.substring(0, 3).toUpperCase();
    const suffix   = Math.floor(1000 + Math.random() * 9000);
    const staffId  = `LK-${shopCode}-${suffix}`;

    // Generate temporary password: first3letters + phone last 4
    const tempPassword = `${dto.name.substring(0, 3).toLowerCase()}${dto.phone.slice(-4)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const staff = this.staffRepo.create({
      shopId:   shop.id,
      name:     dto.name,
      phone:    dto.phone,
      role:     dto.role,
      staffId,
      passwordHash,
      note:     dto.note,
      status:   StaffStatus.ACTIVE,
    });

    await this.staffRepo.save(staff);

    this.logger.log(`Staff added: ${staffId} (${dto.role}) to shop ${shop.name}`);

    return {
      id:            staff.id,
      name:          staff.name,
      phone:         staff.phone,
      staffId:       staff.staffId,
      role:          staff.role,
      permissions:   ROLE_PERMISSIONS[staff.role],
      tempPassword,
      message:       'Share these credentials with the staff member. They should change their password on first login.',
    };
  }

  // ── Update staff role / note ─────────────────────────────
  async updateStaff(ownerId: string, staffMemberId: string, dto: {
    role?: StaffRole; note?: string;
  }) {
    const shop  = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    if (dto.role) staff.role = dto.role;
    if (dto.note !== undefined) staff.note = dto.note;

    await this.staffRepo.save(staff);

    return {
      ...staff,
      permissions: ROLE_PERMISSIONS[staff.role],
    };
  }

  // ── Deactivate staff (removes access immediately) ────────
  async removeStaff(ownerId: string, staffMemberId: string) {
    const shop  = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    staff.status = StaffStatus.INACTIVE;
    await this.staffRepo.save(staff);

    this.logger.log(`Staff deactivated: ${staff.staffId} from shop ${shop.name}`);
    return { success: true, message: `${staff.name}'s access has been removed immediately.` };
  }

  // ── Reset staff password ─────────────────────────────────
  async resetPassword(ownerId: string, staffMemberId: string) {
    const shop  = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const newPassword  = `${staff.name.substring(0, 3).toLowerCase()}${Date.now().toString().slice(-4)}`;
    staff.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.staffRepo.save(staff);

    return { success: true, staffId: staff.staffId, newPassword, message: 'Password reset. Share with staff member.' };
  }

  // ── Staff login ──────────────────────────────────────────
  async staffLogin(staffId: string, password: string) {
    const staff = await this.staffRepo.findOne({
      where: { staffId, status: StaffStatus.ACTIVE },
      relations: ['shop'],
    });

    if (!staff) throw new UnauthorizedException('Invalid Staff ID or account inactive');

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid password');

    staff.lastLoginAt = new Date();
    await this.staffRepo.save(staff);

    const token = this.jwtService.sign({
      sub:         staff.id,
      staffId:     staff.staffId,
      shopId:      staff.shopId,
      role:        'staff',
      staffRole:   staff.role,
      permissions: ROLE_PERMISSIONS[staff.role],
    });

    return {
      token,
      staff: {
        id:          staff.id,
        name:        staff.name,
        staffId:     staff.staffId,
        role:        staff.role,
        shopName:    staff.shop.name,
        permissions: ROLE_PERMISSIONS[staff.role],
      },
    };
  }
}

class UnauthorizedException extends Error {
  constructor(msg: string) { super(msg); this.name = 'UnauthorizedException'; }
}
