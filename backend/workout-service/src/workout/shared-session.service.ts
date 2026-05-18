import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedWorkoutSession } from './shared-session.entity';
import { WorkoutSession } from './workout-session.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { NotificationClient } from './notification.client';

@Injectable()
export class SharedSessionService {
  constructor(
    @InjectRepository(SharedWorkoutSession) private shared: Repository<SharedWorkoutSession>,
    @InjectRepository(WorkoutSession) private sessions: Repository<WorkoutSession>,
    @InjectRepository(WorkoutExercise) private exercises: Repository<WorkoutExercise>,
    private notifClient: NotificationClient,
  ) {}

  async create(hostId: string, data: { title: string; workout_type: string; guest_id?: string }): Promise<SharedWorkoutSession> {
    const room = this.shared.create({
      title: data.title,
      workout_type: data.workout_type,
      host_id: hostId,
      status: 'pending',
    });
    const saved = await this.shared.save(room);
    if (data.guest_id) {
      this.notifClient.send(
        data.guest_id,
        'shared_workout_invite',
        'Shared workout invite',
        `You've been invited to a "${data.title}" session.`,
        { session_id: saved.id, host_id: hostId },
      );
    }
    return saved;
  }

  async join(sharedId: string, guestId: string): Promise<SharedWorkoutSession> {
    const room = await this.shared.findOne({ where: { id: sharedId } });
    if (!room) throw new NotFoundException('Shared session not found');
    if (room.status !== 'pending') throw new BadRequestException('Session already started or finished');
    if (room.host_id === guestId) throw new BadRequestException('Cannot join your own session');

    const hostSession = await this.sessions.save(
      this.sessions.create({ user_id: room.host_id, title: room.title, workout_type: room.workout_type, is_public: true }),
    );
    const guestSession = await this.sessions.save(
      this.sessions.create({ user_id: guestId, title: room.title, workout_type: room.workout_type, is_public: true }),
    );

    room.guest_id = guestId;
    room.host_session_id = hostSession.id;
    room.guest_session_id = guestSession.id;
    room.status = 'active';
    room.started_at = new Date();
    const saved = await this.shared.save(room);
    this.notifClient.send(
      room.host_id,
      'shared_workout_joined',
      'Someone joined your session',
      `A partner joined your "${room.title}" session. Time to compete!`,
      { session_id: sharedId, guest_id: guestId },
    );
    return saved;
  }

  async finish(sharedId: string, userId: string): Promise<SharedWorkoutSession> {
    const room = await this.shared.findOne({ where: { id: sharedId } });
    if (!room) throw new NotFoundException('Shared session not found');
    if (room.host_id !== userId && room.guest_id !== userId) throw new BadRequestException('Not a participant');
    if (room.status !== 'active') throw new BadRequestException('Session is not active');
    room.status = 'finished';
    room.ended_at = new Date();
    return this.shared.save(room);
  }

  async getRoom(sharedId: string): Promise<SharedWorkoutSession> {
    const room = await this.shared.findOne({ where: { id: sharedId } });
    if (!room) throw new NotFoundException('Shared session not found');
    return room;
  }

  getMyRooms(userId: string) {
    return this.shared
      .createQueryBuilder('r')
      .where('r.host_id = :userId OR r.guest_id = :userId', { userId })
      .orderBy('r.created_at', 'DESC')
      .getMany();
  }

  async getLeaderboard(sharedId: string) {
    const room = await this.shared.findOne({ where: { id: sharedId } });
    if (!room) throw new NotFoundException('Shared session not found');

    const [hostExercises, guestExercises] = await Promise.all([
      room.host_session_id ? this.exercises.find({ where: { session_id: room.host_session_id } }) : [],
      room.guest_session_id ? this.exercises.find({ where: { session_id: room.guest_session_id } }) : [],
    ]);

    return {
      room,
      host: { user_id: room.host_id, exercises: hostExercises, ...this.calcTotals(hostExercises) },
      guest: { user_id: room.guest_id, exercises: guestExercises, ...this.calcTotals(guestExercises) },
    };
  }

  private calcTotals(exercises: WorkoutExercise[]) {
    const total_calories = exercises.reduce((s, e) => s + (parseFloat(e.calories as any) || 0), 0);
    const total_sets = exercises.reduce((s, e) => s + (e.sets || 0), 0);
    const total_reps = exercises.reduce((s, e) => s + (e.reps || 0), 0);
    const total_volume = exercises.reduce(
      (s, e) => s + (e.sets || 0) * (e.reps || 0) * (parseFloat(e.weight_kg as any) || 0), 0,
    );
    return {
      total_calories: Math.round(total_calories * 100) / 100,
      total_sets,
      total_reps,
      total_volume: Math.round(total_volume * 100) / 100,
    };
  }
}
