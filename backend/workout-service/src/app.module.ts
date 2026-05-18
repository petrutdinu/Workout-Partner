import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WorkoutModule } from './workout/workout.module';
import { WorkoutSession } from './workout/workout-session.entity';
import { WorkoutExercise } from './workout/workout-exercise.entity';
import { SharedWorkoutSession } from './workout/shared-session.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'workoutpartner',
      username: process.env.DATABASE_USER || 'workoutpartner',
      password: process.env.DATABASE_PASSWORD || 'workoutpartner_password',
      entities: [WorkoutSession, WorkoutExercise, SharedWorkoutSession],
      synchronize: false,
    }),
    HttpModule,
    WorkoutModule,
  ],
})
export class AppModule {}
