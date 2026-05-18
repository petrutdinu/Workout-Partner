import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const MATCHING_SVC = process.env.MATCHING_SERVICE_URL || 'http://matching-service:8003';

@Injectable()
export class NotificationClient {
  constructor(private http: HttpService) {}

  send(userId: string, type: string, title: string, message: string, metadata?: Record<string, any>) {
    return firstValueFrom(
      this.http.post(`${MATCHING_SVC}/api/v1/notifications/internal`, {
        user_id: userId, type, title, message, metadata,
      }),
    ).catch(() => {});
  }
}
