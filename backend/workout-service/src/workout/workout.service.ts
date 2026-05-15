import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from './workout-session.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { estimateSessionCalories, estimateExerciseCalories } from './calorie.service';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutSession) private sessions: Repository<WorkoutSession>,
    @InjectRepository(WorkoutExercise) private exercises: Repository<WorkoutExercise>,
  ) {}

  async createSession(userId: string, data: any, userWeightKg?: number): Promise<WorkoutSession> {
    const exercisesData = data.exercises || [];
    const session = this.sessions.create({
      user_id: userId,
      title: data.title,
      workout_type: data.workout_type,
      started_at: data.started_at ? new Date(data.started_at) : new Date(),
      duration_minutes: data.duration_minutes,
      is_public: data.is_public ?? true,
      notes: data.notes,
    });
    if (session.duration_minutes) {
      session.total_calories = estimateSessionCalories(session.workout_type, session.duration_minutes, userWeightKg);
    }
    await this.sessions.save(session);

    let totalCal = 0;
    for (const ex of exercisesData) {
      const { calories, met } = estimateExerciseCalories(
        ex.exercise_name, ex.sets, ex.reps, ex.weight_kg, ex.duration_sec, userWeightKg,
      );
      const exercise = this.exercises.create({ ...ex, session_id: session.id, calories, met_value: met });
      await this.exercises.save(exercise);
      totalCal += calories;
    }
    if (totalCal > 0 && !session.duration_minutes) {
      session.total_calories = Math.round(totalCal * 1.1 * 100) / 100;
      await this.sessions.save(session);
    }
    return this.sessions.findOne({ where: { id: session.id }, relations: ['exercises'] });
  }

  async addExercise(sessionId: string, userId: string, data: any, userWeightKg?: number) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session || session.user_id !== userId) throw new NotFoundException('Session not found');
    const { calories, met } = estimateExerciseCalories(
      data.exercise_name, data.sets, data.reps, data.weight_kg, data.duration_sec, userWeightKg,
    );
    const exercise = this.exercises.create({ ...data, session_id: sessionId, calories, met_value: met });
    await this.exercises.save(exercise);
    const cur = parseFloat(session.total_calories as any) || 0;
    session.total_calories = Math.round((cur + calories) * 100) / 100;
    await this.sessions.save(session);
    return exercise;
  }

  getSession(id: string) {
    return this.sessions.findOne({ where: { id }, relations: ['exercises'] });
  }

  getUserSessions(userId: string, limit = 50, offset = 0) {
    return this.sessions.find({ where: { user_id: userId }, order: { started_at: 'DESC' }, take: limit, skip: offset });
  }

  getPublicSessionsByUser(userId: string) {
    return this.sessions.find({ where: { user_id: userId, is_public: true }, order: { started_at: 'DESC' } });
  }

  async deleteSession(id: string, userId: string): Promise<boolean> {
    const s = await this.sessions.findOne({ where: { id } });
    if (!s || s.user_id !== userId) return false;
    await this.sessions.remove(s);
    return true;
  }

  async getStats(userId: string) {
    const result = await this.sessions.createQueryBuilder('s')
      .select('COUNT(*)', 'total_sessions')
      .addSelect('SUM(s.total_calories)', 'total_calories')
      .addSelect('SUM(s.duration_minutes)', 'total_minutes')
      .where('s.user_id = :userId', { userId })
      .getRawOne();
    return result;
  }
}
