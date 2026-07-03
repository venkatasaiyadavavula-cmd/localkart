import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../core/entities/user.entity';
import { StaffMember, StaffStatus } from '../../../core/entities/staff-member.entity';
import { ROLE_PERMISSIONS } from '../../seller/staff-permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StaffMember)
    private readonly staffRepository: Repository<StaffMember>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.role === 'staff') {
      const staff = await this.staffRepository.findOne({
        where: { id: payload.sub, status: StaffStatus.ACTIVE },
        relations: ['shop'],
      });

      if (!staff) {
        throw new UnauthorizedException('Staff account not found or inactive');
      }

      return {
        id: staff.id,
        role: 'staff',
        staffRole: staff.role,
        staffId: staff.staffId,
        shopId: staff.shopId,
        shopName: staff.shop?.name,
        name: staff.name,
        permissions: ROLE_PERMISSIONS[staff.role] ?? payload.permissions ?? [],
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }
}
