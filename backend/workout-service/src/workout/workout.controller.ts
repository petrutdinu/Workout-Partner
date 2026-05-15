import {
  Controller, Get, Post, Delete, Body, Param, Query, Headers,
  HttpCode, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';

@Controller('api/v1/workouts')
export class WorkoutController {
  constructor(private service: WorkoutService) {}

  @Get('health')
  health() { return { status: 'healthy', service: 'workout-service' }; }

  @Post()
  create(@Headers('x-user-id') userId: string, @Body() body: any) {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return this.service.createSession(userId, body);
  }

  @Get()
  list(
    @Headers('x-user-id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return this.service.getUserSessions(userId, parseInt(limit) || 50, parseInt(offset) || 0);
  }

  @Get('stats')
  stats(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return this.service.getStats(userId);
  }

  @Get('partner/:partnerId')
  partnerWorkouts(@Param('partnerId') partnerId: string) {
    return this.service.getPublicSessionsByUser(partnerId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const s = await this.service.getSession(id);
    if (!s) throw new NotFoundException('Session not found');
    return s;
  }

  @Post(':id/exercises')
  addExercise(
    @Param('id') sessionId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: any,
  ) {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return this.service.addExercise(sessionId, userId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    const ok = await this.service.deleteSession(id, userId);
    if (!ok) throw new NotFoundException('Session not found');
  }
}
