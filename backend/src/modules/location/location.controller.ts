import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { NearbyShopsDto } from './dto/nearby-shops.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Public } from '../../core/decorators/public.decorator';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Public()
  @Get('nearby-shops')
  async getNearbyShops(@Query() query: NearbyShopsDto) {
    return this.locationService.findNearbyShops(query);
  }

  @Public()
  @Get('search-shops')
  async searchShops(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
    @Query('q') query: string,
  ) {
    return this.locationService.searchShopsByName(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius) || 5,
      query || '',
    );
  }

  @Public()
  @Get('cities')
  async getAvailableCities() {
    return this.locationService.getAvailableCities();
  }

  @Public()
  @Get('pincodes')
  async getPincodesByCity(@Query('city') city: string) {
    return this.locationService.getPincodesByCity(city);
  }
}
