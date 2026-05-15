import {
  Controller, Get, Post, Put, Delete, Body, Param, Headers,
  HttpCode, NotFoundException, BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private service: MatchingService) {}

  private userId(id: string) {
    if (!id) throw new BadRequestException('Missing x-user-id header');
    return id;
  }

  @Get('health')
  health() { return { status: 'healthy', service: 'matching-service' }; }

  @Get('suggestions')
  async suggestions(@Headers('x-user-id') uid: string) {
    const userId = this.userId(uid);
    const profile = await this.service.fetchUser(userId);
    if (!profile) throw new NotFoundException('User profile not found');
    return this.service.getSuggestions(userId, profile);
  }

  @Get('browse')
  async browse(@Headers('x-user-id') uid: string) {
    const userId = this.userId(uid);
    const profile = await this.service.fetchUser(userId);
    return this.service.getSuggestions(userId, profile || {});
  }

  @Get('partners')
  async partners(@Headers('x-user-id') uid: string) {
    const userId = this.userId(uid);
    const ids = await this.service.getPartnerIds(userId);
    return Promise.all(ids.map((id) => this.service.fetchUser(id))).then((r) => r.filter(Boolean));
  }

  @Get('connections')
  async connections(@Headers('x-user-id') uid: string) {
    const userId = this.userId(uid);
    const raw = await this.service.getConnections(userId);
    return this.service.enrichConnections(raw, userId);
  }

  @Post('connections')
  @HttpCode(201)
  async sendRequest(@Headers('x-user-id') uid: string, @Body() body: any) {
    const userId = this.userId(uid);
    const result = await this.service.sendConnection(userId, body.addressee_id, body.match_score);
    if ('error' in result) throw new ConflictException(result.error);
    return result;
  }

  @Put('connections/:id')
  async updateConn(@Param('id') id: string, @Headers('x-user-id') uid: string, @Body() body: any) {
    const userId = this.userId(uid);
    const result = await this.service.updateConnection(id, userId, body.status);
    if (!result) throw new NotFoundException('Connection not found');
    if ('error' in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Delete('connections/:id')
  @HttpCode(204)
  async deleteConn(@Param('id') id: string, @Headers('x-user-id') uid: string) {
    const userId = this.userId(uid);
    const ok = await this.service.deleteConnection(id, userId);
    if (!ok) throw new NotFoundException('Connection not found');
  }
}
