import {
  Controller, Get, Post, Put, Param, Body, Headers, BadRequestException,
} from '@nestjs/common';
import { SharedSessionService } from './shared-session.service';
import { WorkoutService } from './workout.service';
import { SharedSessionGateway } from './shared-session.gateway';

@Controller('api/v1/workouts/shared')
export class SharedSessionController {
  constructor(
    private sharedService: SharedSessionService,
    private workoutService: WorkoutService,
    private gateway: SharedSessionGateway,
  ) {}

  @Post()
  create(@Headers('x-user-id') userId: string, @Body() body: any) {
    if (!userId) throw new BadRequestException('Missing x-user-id');
    return this.sharedService.create(userId, body);
  }

  @Get()
  myRooms(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Missing x-user-id');
    return this.sharedService.getMyRooms(userId);
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.sharedService.getRoom(id);
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.sharedService.getLeaderboard(id);
  }

  @Put(':id/join')
  async join(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Missing x-user-id');
    const room = await this.sharedService.join(id, userId);
    this.gateway.broadcastUpdate(id, await this.sharedService.getLeaderboard(id));
    return room;
  }

  @Put(':id/finish')
  async finish(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Missing x-user-id');
    const room = await this.sharedService.finish(id, userId);
    this.gateway.broadcastUpdate(id, await this.sharedService.getLeaderboard(id));
    return room;
  }

  // Log an exercise into the shared session (routes to the caller's personal session)
  @Post(':id/exercises')
  async addExercise(
    @Param('id') sharedId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: any,
  ) {
    if (!userId) throw new BadRequestException('Missing x-user-id');
    const room = await this.sharedService.getRoom(sharedId);
    if (room.status !== 'active') throw new BadRequestException('Session is not active');

    const sessionId = room.host_id === userId ? room.host_session_id : room.guest_session_id;
    if (!sessionId) throw new BadRequestException('Your workout session is not initialised');

    const exercise = await this.workoutService.addExercise(sessionId, userId, body);
    this.gateway.broadcastUpdate(sharedId, await this.sharedService.getLeaderboard(sharedId));
    return exercise;
  }
}
