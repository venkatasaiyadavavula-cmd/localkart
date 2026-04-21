import { Controller, Get, Query, UseGuards, ParseFloatPipe, ParseIntPipe, Optional } from '@nestjs/common';
import { LocationService } from './location.service';
import { NearbyShopsDto } from './dto/nearby-shops.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Public } from '../../core/decorators/public.decorator';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * దగ్గరలోని షాపులను వడపోతలతో సహా తిరిగి ఇస్తుంది
   */
  @Public()
  @Get('nearby-shops')
  async getNearbyShops(@Query() query: NearbyShopsDto) {
    return this.locationService.findNearbyShops(query);
  }

  /**
   * పేరు ఆధారంగా షాపులను శోధిస్తుంది
   */
  @Public()
  @Get('search-shops')
  async searchShops(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseIntPipe) radius: number,
    @Query('q') query: string,
  ) {
    return this.locationService.searchShopsByName(lat, lng, radius, query);
  }

  /**
   * షాపులు ఉన్న నగరాల జాబితా
   */
  @Public()
  @Get('cities')
  async getAvailableCities() {
    return this.locationService.getAvailableCities();
  }

  /**
   * ఒక నగరంలోని పిన్‌కోడ్‌ల జాబితా
   */
  @Public()
  @Get('pincodes')
  async getPincodesByCity(@Query('city') city: string) {
    return this.locationService.getPincodesByCity(city);
  }

  /**
   * ఇచ్చిన GPS కోఆర్డినేట్లకు సర్వీస్ అందుబాటులో ఉందో లేదో చెక్ చేస్తుంది
   * మరియు దగ్గరి షాపు దూరాన్ని కూడా ఇస్తుంది
   */
  @Public()
  @Get('check-serviceability')
  async checkServiceability(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') @Optional() radius?: string,
  ) {
    const radiusNum = radius ? parseInt(radius, 10) : 20;
    return this.locationService.checkServiceability(lat, lng, radiusNum);
  }
}
