import { Controller, All, Req, Res, Param, UseGuards, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const USER_SVC = process.env.USER_SERVICE_URL || 'http://user-service:8001';
const WORKOUT_SVC = process.env.WORKOUT_SERVICE_URL || 'http://workout-service:8002';
const MATCHING_SVC = process.env.MATCHING_SERVICE_URL || 'http://matching-service:8003';
const GYM_SVC = process.env.GYM_SERVICE_URL || 'http://gym-service:8004';

function send(res: Response, result: { data: any; status: number; headers: any }) {
  const ct = result.headers['content-type'] || 'application/json';
  res.status(result.status).set('content-type', ct).send(result.data);
}

@Controller()
export class ProxyController {
  constructor(
    private proxy: ProxyService,
    private auth: AuthService,
    private http: HttpService,
  ) {}

  @Get()
  root() {
    return {
      service: 'api-gateway',
      version: '2.0.0',
      runtime: 'NestJS',
      endpoints: {
        users: '/api/v1/users',
        workouts: '/api/v1/workouts',
        matching: '/api/v1/matching',
        chat: '/api/v1/chat',
        gyms: '/api/v1/gyms',
      },
    };
  }

  @Get('health')
  health() { return { status: 'healthy', service: 'api-gateway' }; }

  // ── User sync (auto-called on login) ──────────────────────────
  @All('api/v1/users/sync')
  @UseGuards(AuthGuard)
  async syncUser(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const body = { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role };
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, body));
    res.json(user);
  }

  // ── User routes ────────────────────────────────────────────────
  @All('api/v1/users/me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const result = await this.proxy.forward(USER_SVC, `/api/v1/users/me?keycloak_id=${info.keycloak_id}`, req);
    send(res, result);
  }

  @All('api/v1/users/me/fitness-profile')
  @UseGuards(AuthGuard)
  async updateFitness(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    const result = await this.proxy.forward(USER_SVC, `/api/v1/users/${user.id}/fitness-profile`, req);
    send(res, result);
  }

  @All('api/v1/users/athletes')
  @UseGuards(AuthGuard)
  async athletes(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxy.forward(USER_SVC, '/api/v1/users/athletes', req);
    send(res, result);
  }

  @All('api/v1/users/trainers')
  @UseGuards(AuthGuard)
  async trainers(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxy.forward(USER_SVC, '/api/v1/users/trainers', req);
    send(res, result);
  }

  @All('api/v1/users/:id')
  @UseGuards(AuthGuard)
  async userById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const result = await this.proxy.forward(USER_SVC, `/api/v1/users/${id}`, req);
    send(res, result);
  }

  // ── Workout routes ─────────────────────────────────────────────
  @All('api/v1/workouts*')
  @UseGuards(AuthGuard)
  async workouts(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    const result = await this.proxy.forward(WORKOUT_SVC, req.path, req, { 'x-user-id': user.id });
    send(res, result);
  }

  // ── Shared workout routes (competitive sessions) ───────────────
  @All('api/v1/shared-workouts*')
  @UseGuards(AuthGuard)
  async sharedWorkouts(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    // Rewrite /api/v1/shared-workouts -> /api/v1/workouts/shared on the workout-service
    const rewritten = req.path.replace('/api/v1/shared-workouts', '/api/v1/workouts/shared');
    const result = await this.proxy.forward(WORKOUT_SVC, rewritten, req, { 'x-user-id': user.id });
    send(res, result);
  }

  // ── Matching routes ────────────────────────────────────────────
  @All('api/v1/matching*')
  @UseGuards(AuthGuard)
  async matching(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    const result = await this.proxy.forward(MATCHING_SVC, req.path, req, { 'x-user-id': user.id });
    send(res, result);
  }

  // ── Chat routes ────────────────────────────────────────────────
  @All('api/v1/chat*')
  @UseGuards(AuthGuard)
  async chat(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    const result = await this.proxy.forward(MATCHING_SVC, req.path, req, { 'x-user-id': user.id });
    send(res, result);
  }

  // ── Notification routes ────────────────────────────────────────
  @All('api/v1/notifications*')
  @UseGuards(AuthGuard)
  async notifications(@Req() req: Request, @Res() res: Response) {
    const info = (req as any).userInfo;
    const { data: user } = await firstValueFrom(this.http.post(`${USER_SVC}/api/v1/users/sync`, { keycloak_id: info.keycloak_id, email: info.email, username: info.username, first_name: info.first_name, last_name: info.last_name, role: info.primary_role }));
    const result = await this.proxy.forward(MATCHING_SVC, req.path, req, { 'x-user-id': user.id });
    send(res, result);
  }

  // ── Gym routes ─────────────────────────────────────────────────
  @All('api/v1/gyms*')
  @UseGuards(AuthGuard)
  async gyms(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxy.forward(GYM_SVC, req.path, req);
    send(res, result);
  }
}
