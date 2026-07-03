import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request, UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffRole } from '../../core/entities/staff-member.entity';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';
import { Public } from '../../core/decorators/public.decorator';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsPhoneNumber, MinLength, MaxLength, Matches } from 'class-validator';

class AddStaffDto {
  @IsString() @IsNotEmpty() name: string;
  @IsPhoneNumber('IN') phone: string;
  @IsEnum(StaffRole) @IsOptional() role?: StaffRole;
  @IsString() @IsOptional() note?: string;
  @IsString() @IsOptional() @MinLength(4) @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._+-]+$/, { message: 'Login ID: letters, numbers, _ . + - only' })
  staffId?: string;
  @IsString() @IsOptional() @MinLength(4) @MaxLength(64) password?: string;
}

class UpdateStaffDto {
  @IsEnum(StaffRole) @IsOptional() role?: StaffRole;
  @IsString() @IsOptional() note?: string;
}

class StaffLoginDto {
  @IsString() @IsNotEmpty() staffId: string;
  @IsString() @IsNotEmpty() password: string;
}

class ResetPasswordDto {
  @IsString() @IsOptional() @MinLength(4) password?: string;
}

@Controller('seller/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getStaff(@Request() req: any) {
    return this.staffService.getStaff(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  addStaff(@Request() req: any, @Body() dto: AddStaffDto) {
    return this.staffService.addStaff(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateStaff(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.updateStaff(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  removeStaff(@Request() req: any, @Param('id') id: string) {
    return this.staffService.removeStaff(req.user.id, id);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  resetPassword(@Request() req: any, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.staffService.resetPassword(req.user.id, id, dto.password);
  }

  @Public()
  @Post('login')
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.staffService.staffLogin(dto.staffId, dto.password);
  }
}
