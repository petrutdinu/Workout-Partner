import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('direct_messages')
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sender_id: string;

  @Column('uuid')
  receiver_id: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  sent_at: Date;
}
