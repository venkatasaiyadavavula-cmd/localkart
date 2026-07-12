import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedAddress, AddressType } from '../../core/entities/saved-address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(SavedAddress)
    private readonly addressRepo: Repository<SavedAddress>,
  ) {}

  async getAddresses(userId: string) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const type = dto.type ?? AddressType.HOME;
    const label = dto.label?.trim() || dto.name?.trim() || 'Home';
    const fullAddress =
      dto.fullAddress?.trim() ||
      [dto.address, dto.city, dto.state, dto.pincode].filter(Boolean).join(', ');

    if (!fullAddress) {
      throw new BadRequestException('Address is required');
    }

    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    const count = await this.addressRepo.count({ where: { userId } });
    if (count >= 10) {
      throw new BadRequestException('Maximum 10 addresses allowed');
    }

    const address = this.addressRepo.create({
      userId,
      type,
      label,
      fullAddress,
      landmark: dto.landmark,
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      isDefault: dto.isDefault ?? false,
    });
    return this.addressRepo.save(address);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    const allowed: Partial<SavedAddress> = {};
    if (dto.type !== undefined) allowed.type = dto.type;
    if (dto.label !== undefined) allowed.label = dto.label;
    if (dto.fullAddress !== undefined) allowed.fullAddress = dto.fullAddress;
    if (dto.landmark !== undefined) allowed.landmark = dto.landmark;
    if (dto.pincode !== undefined) allowed.pincode = dto.pincode;
    if (dto.latitude !== undefined) allowed.latitude = dto.latitude;
    if (dto.longitude !== undefined) allowed.longitude = dto.longitude;
    if (dto.isDefault !== undefined) allowed.isDefault = dto.isDefault;

    await this.addressRepo.update({ id, userId }, allowed);
    return this.addressRepo.findOne({ where: { id, userId } });
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    await this.addressRepo.remove(address);
    return { message: 'Address deleted' };
  }

  async setDefault(userId: string, id: string) {
    await this.addressRepo.update({ userId }, { isDefault: false });
    await this.addressRepo.update({ id, userId }, { isDefault: true });
    return { message: 'Default address updated' };
  }
}
