import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Rota: /locations/states/33/cities
  @Get('states/:stateId/cities')
  async getCities(@Param('stateId') stateId: string) {
    return this.locationService.getCities(stateId);
  }

  // Rota: /locations/cities/12345/districts
  @Get('cities/:cityId/districts')
  async getDistricts(@Param('cityId') cityId: string) {
    return this.locationService.getDistricts(cityId);
  }
}