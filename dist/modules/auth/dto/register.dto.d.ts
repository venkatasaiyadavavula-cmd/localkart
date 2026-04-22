import { UserRole } from '../../../core/entities/user.entity';
export declare class RegisterDto {
    name: string;
    phone: string;
    email?: string;
    password: string;
    role?: UserRole;
}
