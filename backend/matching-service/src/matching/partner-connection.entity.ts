import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('partner_connections')
export class PartnerConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  requester_id: string;

  @Column('uuid')
  addressee_id: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  match_score: number;

  @Column({ default: 'user' })
  initiated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
