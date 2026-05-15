import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const token = header.slice(7);
    req.claims = await this.auth.validateToken(token);
    req.userInfo = this.auth.extractUserInfo(req.claims);
    return true;
  }
}
