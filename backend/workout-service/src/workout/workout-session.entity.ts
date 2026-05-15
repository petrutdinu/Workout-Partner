import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  title: string;

  @Column()
  workout_type: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date;

  @Column({ type: 'smallint', nullable: true })
  duration_minutes: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  total_calories: number;

  @Column({ default: true })
  is_public: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => WorkoutExercise, (e) => e.session, { cascade: true, eager: true })
  exercises: WorkoutExercise[];
}
