import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationService } from '../notification/notification.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private notifications: NotificationService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
    }
  }

  handleDisconnect(client: Socket) {
    this.userSockets.delete(client.data.userId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    const senderId = client.data.userId;
    if (!senderId || !data.content?.trim()) return;

    const msg = await this.chatService.saveMessage(senderId, data.receiverId, data.content.trim());

    client.emit('newMessage', msg);

    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', msg);
    }

    const preview = data.content.trim().slice(0, 60);
    this.notifications.create(
      data.receiverId,
      'new_message',
      'New message',
      preview,
      { sender_id: senderId, message_id: msg.id },
    ).catch(() => {});
  }
}
