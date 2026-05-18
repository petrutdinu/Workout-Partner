import {
  Controller, Get, Param, Headers, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { PublicProfileService } from './public-profile.service';

@Controller('users')
export class PublicProfileController {
  constructor(
    private matching: MatchingService,
    private profile: PublicProfileService,
  ) {}

  @Get(':id/public-profile')
  async getPublicProfile(
    @Param('id') targetId: string,
    @Headers('x-user-id') viewerId: string,
  ) {
    if (!viewerId) throw new BadRequestException('Missing x-user-id header');

    const targetUser = await this.matching.fetchUser(targetId);
    if (!targetUser) throw new NotFoundException('User not found');

    if (viewerId === targetId) {
      const stats = await this.profile.fetchStats(targetId);
      const workouts = await this.profile.fetchPublicWorkouts(targetId);
      return {
        connectionStatus: 'self',
        user: targetUser,
        stats,
        workouts,
      };
    }

    const connectionStatus = await this.profile.getConnectionStatus(viewerId, targetId);

    if (connectionStatus === 'accepted') {
      const stats = await this.profile.fetchStats(targetId);
      const workouts = await this.profile.fetchPublicWorkouts(targetId);
      return {
        connectionStatus,
        user: targetUser,
        stats,
        workouts,
      };
    }

    return {
      connectionStatus,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        city: targetUser.city,
        fitness_level: targetUser.fitness_level,
        primary_goal: targetUser.primary_goal,
        bio: targetUser.bio,
      },
      stats: null,
      workouts: null,
    };
  }
}
