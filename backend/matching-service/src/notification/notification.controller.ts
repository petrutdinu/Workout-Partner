import {
  Controller, Get, Post, Patch, Param, Body, Headers, BadRequestException, Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  private uid(id: string) {
    if (!id) throw new BadRequestException('Missing x-user-id header');
    return id;
  }

  @Get()
  getAll(@Headers('x-user-id') uid: string, @Query('limit') limit?: string) {
    return this.service.getForUser(this.uid(uid), parseInt(limit) || 30);
  }

  @Get('unread-count')
  async unreadCount(@Headers('x-user-id') uid: string) {
    const count = await this.service.getUnreadCount(this.uid(uid));
    return { count };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Headers('x-user-id') uid: string) {
    await this.service.markRead(id, this.uid(uid));
    return { ok: true };
  }

  @Patch('read-all')
  async markAllRead(@Headers('x-user-id') uid: string) {
    await this.service.markAllRead(this.uid(uid));
    return { ok: true };
  }

  @Post('internal')
  createInternal(@Body() body: { user_id: string; type: string; title: string; message: string; metadata?: Record<string, any> }) {
    return this.service.create(body.user_id, body.type, body.title, body.message, body.metadata);
  }
}
