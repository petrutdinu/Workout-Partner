import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { OverpassService } from './overpass.service';

const TTL = parseInt(process.env.GYM_CACHE_TTL) || 21600;

@Injectable()
export class GymService implements OnModuleInit {
  private redis: Redis;

  constructor(private overpass: OverpassService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => { /* Redis unavailable — run without cache */ });
    this.redis.connect().catch(() => {});
  }

  private cacheKey(params: any) {
    return `gyms:${JSON.stringify(params)}`;
  }

  private async redisGet(key: string): Promise<string | null> {
    try { return await this.redis.get(key); } catch { return null; }
  }

  private async redisSetex(key: string, ttl: number, value: string): Promise<void> {
    try { await this.redis.setex(key, ttl, value); } catch { /* ignore */ }
  }

  async getGyms(lat?: number, lon?: number, radiusKm = 10, bbox?: string, forceRefresh = false) {
    const params = { lat, lon, radiusKm, bbox };
    const key = this.cacheKey(params);

    if (!forceRefresh) {
      const cached = await this.redisGet(key);
      if (cached) return { gyms: JSON.parse(cached), cached: true };
    }

    let bboxArr: number[] | undefined;
    if (bbox) {
      const parts = bbox.split(',').map(Number);
      if (parts.length !== 4) throw new Error('bbox must be minLon,minLat,maxLon,maxLat');
      bboxArr = [parts[1], parts[0], parts[3], parts[2]];
    }
    const gyms = await this.overpass.fetchGyms(lat, lon, radiusKm, bboxArr);
    await this.redisSetex(key, TTL, JSON.stringify(gyms));
    return { gyms, cached: false };
  }

  async invalidateCache() {
    try {
      const keys = await this.redis.keys('gyms:*');
      if (keys.length) await this.redis.del(...keys);
      return keys.length;
    } catch { return 0; }
  }
}
