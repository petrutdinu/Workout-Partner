import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

const EXCLUDED = new Set(['host', 'content-length', 'transfer-encoding', 'connection']);

@Injectable()
export class ProxyService {
  constructor(private http: HttpService) {}

  async forward(serviceUrl: string, path: string, req: Request, extraHeaders: Record<string, string> = {}) {
    const url = `${serviceUrl}${path}`;
    const headers: Record<string, string> = { ...extraHeaders };
    for (const [k, v] of Object.entries(req.headers)) {
      if (!EXCLUDED.has(k.toLowerCase()) && typeof v === 'string') headers[k] = v;
    }
    const params = req.query as Record<string, string>;

    try {
      const response = await firstValueFrom(
        this.http.request({
          method: req.method as any,
          url,
          params,
          headers,
          data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
          timeout: 30000,
          responseType: 'arraybuffer',
          validateStatus: () => true,
        }),
      );
      return { data: response.data, status: response.status, headers: response.headers };
    } catch (e) {
      throw new ServiceUnavailableException(`Service unavailable: ${e.message}`);
    }
  }
}
