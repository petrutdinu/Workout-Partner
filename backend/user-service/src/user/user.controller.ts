import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/v1/users')
export class UserController {
  constructor(private service: UserService) {}

  @Get('health')
  health() { return { status: 'healthy', service: 'user-service' }; }

  @Post('sync')
  sync(@Body() body: any) { return this.service.getOrCreate(body); }

  @Get('me')
  async me(@Query('keycloak_id') keycloakId: string) {
    const user = await this.service.findByKeycloakId(keycloakId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get('athletes')
  athletes(
    @Query('fitness_level') fitnessLevel?: string,
    @Query('primary_goal') primaryGoal?: string,
    @Query('city') city?: string,
    @Query('exclude_id') excludeId?: string,
  ) {
    return this.service.findAthletes(fitnessLevel, primaryGoal, city, excludeId);
  }

  @Get('trainers')
  trainers() { return this.service.findTrainers(); }

  @Get()
  all() { return this.service.findAll(); }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const user = await this.service.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Put(':id/fitness-profile')
  async updateProfile(@Param('id') id: string, @Body() body: any) {
    const user = await this.service.updateFitnessProfile(id, body);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException('User not found');
  }
}
