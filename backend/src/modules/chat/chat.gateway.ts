import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;
      client.join(`user:${userId}`);

      // Join all existing conversation rooms
      const conversations = await this.chatService.getUserConversations(userId, {
        page: 1,
        limit: 100,
        get skip() { return 0; },
      } as any);

      for (const conv of conversations.items) {
        client.join(`conversation:${conv.id}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {
    // Cleanup handled automatically by Socket.io
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; messageType?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(userId, data.conversationId, {
        content: data.content,
        messageType: data.messageType as any,
      });

      // Emit to conversation room
      this.server.to(`conversation:${data.conversationId}`).emit('message:receive', message);

      // Get recipient and emit unread count update via notifications gateway
      const conversation = await this.chatService['prisma'].conversation.findUnique({
        where: { id: data.conversationId },
      });
      if (conversation) {
        const recipientId = this.chatService.getRecipientId(conversation, userId);
        const unread = await this.chatService.getUnreadCount(recipientId);
        this.notificationsGateway.emitToUser(recipientId, 'chat:unreadCount', unread);
      }
    } catch (error) {
      client.emit('message:error', { error: error.message });
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      await this.chatService.markMessagesAsRead(userId, data.conversationId);

      // Notify the other participant that messages were read
      this.server.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    } catch {
      // Silently ignore read errors
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.join(`conversation:${data.conversationId}`);
  }
}
