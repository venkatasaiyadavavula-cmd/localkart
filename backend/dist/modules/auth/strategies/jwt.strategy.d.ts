import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../core/entities/user.entity';
import { StaffMember } from '../../../core/entities/staff-member.entity';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly userRepository;
    private readonly staffRepository;
    constructor(configService: ConfigService, userRepository: Repository<User>, staffRepository: Repository<StaffMember>);
    validate(payload: any): Promise<{
        id: string;
        role: string;
        staffRole: import("../../../core/entities/staff-member.entity").StaffRole;
        staffId: string;
        shopId: string;
        shopName: string;
        name: string;
        permissions: any;
        phone?: undefined;
        email?: undefined;
    } | {
        id: string;
        phone: string;
        email: string;
        role: import("../../../core/entities/user.entity").UserRole;
        name: string;
        staffRole?: undefined;
        staffId?: undefined;
        shopId?: undefined;
        shopName?: undefined;
        permissions?: undefined;
    }>;
}
export {};
