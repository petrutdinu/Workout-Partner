import {
  Controller, Get, Put, Param, Query, Headers,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Get('messages/:otherUserId')
  getMessages(
    @Param('otherUserId') otherUserId: string,
    @Headers('x-user-id') uid: string,
    @Query('limit') limit?: string,
  ) {
    if (!uid) throw new BadRequestException('Missing x-user-id header');
    return this.service.getConversation(uid, otherUserId, parseInt(limit) || 50);
  }

  @Put('messages/:messageId/read')
  async markRead(@Param('messageId') messageId: string, @Headers('x-user-id') uid: string) {
    if (!uid) throw new BadRequestException('Missing x-user-id header');
    const msg = await this.service.markRead(messageId, uid);
    if (!msg) throw new NotFoundException('Message not found');
    return msg;
  }
}
