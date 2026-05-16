import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('shared_workout_sessions')
export class SharedWorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  workout_type: string;

  @Column('uuid')
  host_id: string;

  @Column('uuid', { nullable: true })
  guest_id: string;

  @Column('uuid', { nullable: true })
  host_session_id: string;

  @Column('uuid', { nullable: true })
  guest_session_id: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
