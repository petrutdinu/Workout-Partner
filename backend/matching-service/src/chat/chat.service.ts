import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';

@Injectable()
export class ChatService {
  constructor(@InjectRepository(DirectMessage) private repo: Repository<DirectMessage>) {}

  getConversation(userA: string, userB: string, limit = 50) {
    return this.repo.createQueryBuilder('m')
      .where('(m.sender_id = :a AND m.receiver_id = :b) OR (m.sender_id = :b AND m.receiver_id = :a)', { a: userA, b: userB })
      .orderBy('m.sent_at', 'DESC')
      .take(limit)
      .getMany()
      .then((msgs) => msgs.reverse());
  }

  saveMessage(senderId: string, receiverId: string, content: string) {
    const msg = this.repo.create({ sender_id: senderId, receiver_id: receiverId, content });
    return this.repo.save(msg);
  }

  async markRead(messageId: string, userId: string) {
    const msg = await this.repo.findOne({ where: { id: messageId, receiver_id: userId } });
    if (!msg) return null;
    msg.is_read = true;
    return this.repo.save(msg);
  }
}
