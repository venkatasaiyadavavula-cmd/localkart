import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedAddress, AddressType } from '../../core/entities/saved-address.entity';

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

  async addAddress(userId: string, dto: {
    type: AddressType;
    label: string;
    fullAddress: string;
    landmark?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    const count = await this.addressRepo.count({ where: { userId } });
    if (count >= 10) {
      throw new BadRequestException('Maximum 10 addresses allowed');
    }

    const address = this.addressRepo.create({ ...dto, userId });
    return this.addressRepo.save(address);
  }

  async updateAddress(userId: string, id: string, dto: Partial<{
    type: AddressType;
    label: string;
    fullAddress: string;
    landmark: string;
    pincode: string;
    isDefault: boolean;
  }>) {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    await this.addressRepo.update(id, dto);
    return this.addressRepo.findOne({ where: { id } });
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
