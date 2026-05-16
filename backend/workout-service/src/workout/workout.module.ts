import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutSession } from './workout-session.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { SharedWorkoutSession } from './shared-session.entity';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { SharedSessionService } from './shared-session.service';
import { SharedSessionController } from './shared-session.controller';
import { SharedSessionGateway } from './shared-session.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutSession, WorkoutExercise, SharedWorkoutSession])],
  providers: [WorkoutService, SharedSessionService, SharedSessionGateway],
  controllers: [SharedSessionController, WorkoutController],
})
export class WorkoutModule {}
