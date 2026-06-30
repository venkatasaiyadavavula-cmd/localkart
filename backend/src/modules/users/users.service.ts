import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../core/entities/user.entity';
import { Shop } from '../../core/entities/shop.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['shop'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, lastOtp, ...userProfile } = user;
    return userProfile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent email change to an existing email
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Update password if provided
    if (updateProfileDto.password) {
      if (!updateProfileDto.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }
      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(updateProfileDto.password, 10);
    }

    // Update other fields
    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.email) user.email = updateProfileDto.email;
    if (updateProfileDto.address) user.address = updateProfileDto.address;
    if (updateProfileDto.latitude) user.latitude = updateProfileDto.latitude;
    if (updateProfileDto.longitude) user.longitude = updateProfileDto.longitude;
    if (updateProfileDto.profileImage) user.profileImage = updateProfileDto.profileImage;

    await this.userRepository.save(user);

    const { password, lastOtp, ...updatedProfile } = user;
    return updatedProfile;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['shop'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, lastOtp, ...userData } = user;
    return userData;
  }

  async deactivateUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = false;
    await this.userRepository.save(user);
    return { message: 'User deactivated successfully' };
  }

  async activateUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = true;
    await this.userRepository.save(user);
    return { message: 'User activated successfully' };
  }

  async getShopByOwnerId(ownerId: string) {
    const shop = await this.shopRepository.findOne({
      where: { ownerId },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found for this user');
    }
    return shop;
  }
}
