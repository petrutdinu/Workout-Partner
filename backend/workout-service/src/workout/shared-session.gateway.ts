import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, ConnectedSocket, MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/workout' })
export class SharedSessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) client.data.userId = userId;
  }

  handleDisconnect(_client: Socket) {}

  // Client calls this to subscribe to a shared room's updates
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() sharedId: string) {
    client.join(`shared:${sharedId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() sharedId: string) {
    client.leave(`shared:${sharedId}`);
  }

  broadcastUpdate(sharedId: string, leaderboard: any) {
    this.server.to(`shared:${sharedId}`).emit('leaderboardUpdate', leaderboard);
  }
}
