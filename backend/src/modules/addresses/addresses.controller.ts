import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async getAddresses(@CurrentUser() user: any) {
    return this.addressesService.getAddresses(user.id);
  }

  @Post()
  async addAddress(
    @CurrentUser() user: any,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.addAddress(user.id, dto);
  }

  @Put(':id')
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(user.id, id, dto);
  }

  @Delete(':id')
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.deleteAddress(user.id, id);
  }

  @Put(':id/default')
  async setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id, id);
  }
}
