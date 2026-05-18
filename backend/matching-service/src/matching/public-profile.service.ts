import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PartnerConnection } from './partner-connection.entity';

const WORKOUT_SVC = process.env.WORKOUT_SERVICE_URL || 'http://workout-service:8002';

@Injectable()
export class PublicProfileService {
  constructor(
    @InjectRepository(PartnerConnection) private repo: Repository<PartnerConnection>,
    private http: HttpService,
  ) {}

  async getConnectionStatus(
    viewerId: string,
    targetId: string,
  ): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted'> {
    const conn = await this.repo.findOne({
      where: [
        { requester_id: viewerId, addressee_id: targetId },
        { requester_id: targetId, addressee_id: viewerId },
      ],
    });
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'accepted';
    if (conn.status === 'pending') {
      return conn.requester_id === viewerId ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  }

  async fetchStats(userId: string): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${WORKOUT_SVC}/api/v1/workouts/stats`, {
          headers: { 'x-user-id': userId },
          timeout: 8000,
        }),
      );
      return data;
    } catch { return null; }
  }

  async fetchPublicWorkouts(userId: string): Promise<any[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${WORKOUT_SVC}/api/v1/workouts/partner/${userId}`, { timeout: 8000 }),
      );
      return data || [];
    } catch { return []; }
  }
}
