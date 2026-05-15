import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  keycloak_id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ default: 'Athlete' })
  role: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'smallint', nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  fitness_level: string;

  @Column({ nullable: true })
  primary_goal: string;

  @Column({ type: 'text', array: true, nullable: true })
  workout_types: string[];

  @Column({ type: 'text', array: true, nullable: true })
  preferred_days: string[];

  @Column({ nullable: true })
  preferred_time: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weight_kg: number;

  @Column({ type: 'text', array: true, nullable: true })
  certifications: string[];

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  hourly_rate: number;

  @Column({ default: false })
  profile_complete: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
