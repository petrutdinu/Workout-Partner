import { Controller, Get, Post, Query } from '@nestjs/common';
import { GymService } from './gym.service';

@Controller()
export class GymController {
  constructor(private service: GymService) {}

  @Get('health')
  health() { return { status: 'healthy', service: 'gym-service' }; }

  @Get('api/v1/gyms')
  async getGyms(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('radius_km') radius?: string,
    @Query('bbox') bbox?: string,
    @Query('force_refresh') forceRefresh?: string,
  ) {
    const result = await this.service.getGyms(
      lat ? parseFloat(lat) : undefined,
      lon ? parseFloat(lon) : undefined,
      radius ? parseFloat(radius) : 10,
      bbox,
      forceRefresh === 'true',
    );
    return { ...result, count: result.gyms.length };
  }

  @Post('api/v1/gyms/cache/invalidate')
  async invalidate() {
    const deleted = await this.service.invalidateCache();
    return { deleted_keys: deleted, status: 'cache cleared' };
  }
}
