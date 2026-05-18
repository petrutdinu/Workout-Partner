import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WorkoutSession } from './workout-session.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { SharedWorkoutSession } from './shared-session.entity';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { SharedSessionService } from './shared-session.service';
import { SharedSessionController } from './shared-session.controller';
import { SharedSessionGateway } from './shared-session.gateway';
import { NotificationClient } from './notification.client';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutSession, WorkoutExercise, SharedWorkoutSession]), HttpModule],
  providers: [WorkoutService, SharedSessionService, SharedSessionGateway, NotificationClient],
  controllers: [SharedSessionController, WorkoutController],
})
export class WorkoutModule {}
