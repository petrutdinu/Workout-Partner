import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PartnerConnection } from './partner-connection.entity';
import { rankCandidates } from './matching.algorithm';
import { NotificationService } from '../notification/notification.service';

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:8001';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(PartnerConnection) private repo: Repository<PartnerConnection>,
    private http: HttpService,
    private notifications: NotificationService,
  ) {}

  private async fetchAllAthletes(excludeId?: string, filters: Record<string, string> = {}): Promise<any[]> {
    try {
      const params: Record<string, string> = { ...filters };
      if (excludeId) params.exclude_id = excludeId;
      const { data } = await firstValueFrom(this.http.get(`${USER_SERVICE}/api/v1/users/athletes`, { params, timeout: 10000 }));
      return data || [];
    } catch { return []; }
  }

  async fetchUser(userId: string): Promise<any> {
    try {
      const { data } = await firstValueFrom(this.http.get(`${USER_SERVICE}/api/v1/users/${userId}`, { timeout: 10000 }));
      return data;
    } catch { return null; }
  }

  private async findAcceptedPartnerIds(userId: string): Promise<Set<string>> {
    const conns = await this.repo.find({
      where: [{ requester_id: userId, status: 'accepted' }, { addressee_id: userId, status: 'accepted' }],
    });
    const ids = new Set<string>();
    for (const c of conns) {
      ids.add(c.requester_id === userId ? c.addressee_id : c.requester_id);
    }
    return ids;
  }

  async getSuggestions(userId: string, profile: any, filters: Record<string, string> = {}) {
    const all = await this.fetchAllAthletes(userId, filters);
    const accepted = await this.findAcceptedPartnerIds(userId);
    const nonCandidateConns = await this.repo.find({
      where: [
        { requester_id: userId, status: 'pending' },
        { addressee_id: userId, status: 'pending' },
        { requester_id: userId, status: 'blocked' },
        { addressee_id: userId, status: 'blocked' },
        { requester_id: userId, status: 'declined' },
        { addressee_id: userId, status: 'declined' },
      ],
    });
    const excludedIds = new Set(nonCandidateConns.map((c) => c.requester_id === userId ? c.addressee_id : c.requester_id));
    const excluded = new Set([...accepted, ...excludedIds]);
    const candidates = all.filter((u) => !excluded.has(u.id));
    return rankCandidates(profile, candidates);
  }

  async sendConnection(requesterId: string, addresseeId: string, matchScore?: number) {
    const existing = await this.repo.findOne({
      where: [
        { requester_id: requesterId, addressee_id: addresseeId },
        { requester_id: addresseeId, addressee_id: requesterId },
      ],
    });
    if (existing) return { error: 'Connection already exists', status: existing.status };
    const conn = this.repo.create({ requester_id: requesterId, addressee_id: addresseeId, match_score: matchScore, status: 'pending', initiated_by: 'user' });
    const saved = await this.repo.save(conn);
    const requester = await this.fetchUser(requesterId);
    const name = requester?.first_name || requester?.username || 'Someone';
    this.notifications.create(
      addresseeId,
      'partner_request',
      'New partner request',
      `${name} sent you a partner request.`,
      { connection_id: saved.id, requester_id: requesterId },
    ).catch(() => {});
    return saved;
  }

  async updateConnection(connId: string, userId: string, newStatus: string) {
    const conn = await this.repo.findOne({ where: { id: connId } });
    if (!conn) return null;
    if (['accepted', 'declined'].includes(newStatus) && conn.addressee_id !== userId) return { error: 'Not authorized' };
    conn.status = newStatus;
    const saved = await this.repo.save(conn);
    if (newStatus === 'accepted') {
      const accepter = await this.fetchUser(userId);
      const name = accepter?.first_name || accepter?.username || 'Someone';
      this.notifications.create(
        conn.requester_id,
        'partner_accepted',
        'Partner request accepted',
        `${name} accepted your partner request.`,
        { connection_id: connId, partner_id: userId },
      ).catch(() => {});
    }
    return saved;
  }

  async deleteConnection(connId: string, userId: string): Promise<boolean> {
    const conn = await this.repo.findOne({ where: { id: connId } });
    if (!conn || (conn.requester_id !== userId && conn.addressee_id !== userId)) return false;
    await this.repo.remove(conn);
    return true;
  }

  getConnections(userId: string) {
    return this.repo.find({
      where: [{ requester_id: userId }, { addressee_id: userId }],
      order: { created_at: 'DESC' },
    });
  }

  async getPartnerIds(userId: string): Promise<string[]> {
    const ids = await this.findAcceptedPartnerIds(userId);
    return [...ids];
  }

  async enrichConnections(connections: PartnerConnection[], userId: string) {
    const cache: Record<string, any> = {};
    const fetch = async (id: string) => {
      if (!cache[id]) cache[id] = await this.fetchUser(id);
      return cache[id];
    };
    const pick = (u: any) => u ? { id: u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, fitness_level: u.fitness_level, city: u.city } : null;
    return Promise.all(connections.map(async (c) => ({
      ...c,
      is_requester: c.requester_id === userId,
      requester: pick(await fetch(c.requester_id)),
      addressee: pick(await fetch(c.addressee_id)),
    })));
  }
}
