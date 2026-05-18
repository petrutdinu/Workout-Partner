import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  create(userId: string, type: string, title: string, message: string, metadata?: Record<string, any>) {
    const n = this.repo.create({ user_id: userId, type, title, message, metadata });
    return this.repo.save(n);
  }

  getForUser(userId: string, limit = 30) {
    return this.repo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { user_id: userId, is_read: false } });
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, user_id: userId }, { is_read: true });
  }

  async markAllRead(userId: string) {
    await this.repo.update({ user_id: userId, is_read: false }, { is_read: true });
  }
}
