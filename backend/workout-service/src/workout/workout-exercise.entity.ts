import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { WorkoutSession } from './workout-session.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  session_id: string;

  @Column()
  exercise_name: string;

  @Column({ type: 'smallint', nullable: true })
  sets: number;

  @Column({ type: 'smallint', nullable: true })
  reps: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  weight_kg: number;

  @Column({ type: 'integer', nullable: true })
  duration_sec: number;

  @Column({ type: 'numeric', precision: 8, scale: 3, nullable: true })
  distance_km: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  calories: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  met_value: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => WorkoutSession, (s) => s.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: WorkoutSession;
}
