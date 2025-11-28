// src/chat/chat.gateway.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PremiumGroupsService } from 'src/premium-group/premium-group.service';

interface AuthPayload {
  userId: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly premiumGroupsService: PremiumGroupsService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      // Bearer token headers se/ auth se
      // console.log('client.handshake', client.handshake);
      const authHeader =
        (client.handshake.headers['authorization'] as string) ||
        (client.handshake.auth?.authorization as string);
      if (!authHeader || !authHeader.startsWith('Bearer')) {
        this.logger.warn('No auth token, disconnecting');
        client.disconnect();
        return;
      }

      const token = authHeader.replace('Bearer ', '').trim();

      const payload = this.jwtService.verify(token);
      const userId = payload.sub as string;
     console.log('WebSocket connected userId=', userId);
      const groupId = client.handshake.query.groupId as string;
      if (!groupId) {
        this.logger.warn('No groupId provided');
        client.disconnect();
        return;
      }

      // check access
      const { hasAccess } = await this.premiumGroupsService.hasActiveAccess(
        userId,
        groupId
      );
      if (!hasAccess) {
        this.logger.warn(`No active access for user ${userId} group ${groupId}`);
        client.emit('access_denied', {
          message: 'Premium time expired or not purchased',
        });
        client.disconnect();
        return;
      }

      // store for later usage
      (client.data as any).userId = userId;
      (client.data as any).groupId = groupId;

      const roomName = `group_${groupId}`;
      client.join(roomName);

      this.logger.log(
        `Client connected user=${userId} group=${groupId} socket=${client.id}`,
      );

      // optionally previous messages yahan se bhej sakte ho:
      // const messages = await this.messagesService.findByGroup(groupId);
      // client.emit('previous_messages', messages);
    } catch (err) {
      this.logger.error('handleConnection error', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected ${client.id}`);
  }

  // user se message aaya
  @SubscribeMessage('user_message')
  async handleUserMessage(
    @MessageBody()
    data: { text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId;
    const groupId = (client.data as any).groupId;

    if (!userId || !groupId) {
      return;
    }

    const msg = {
      id: Date.now().toString(),
      from: 'user',
      userId,
      groupId,
      text: data.text,
      createdAt: new Date().toISOString(),
    };

    const roomName = `group_${groupId}`;

    // yahan tum DB me save bhi kar sakte ho
    // await this.messagesService.create(msg);

    // broadcast to same group (sab clients - admins + users)
    this.server.to(roomName).emit('group_message', msg);
  }

  // admin panel se message (e.g. namespace same / alag)
  @SubscribeMessage('admin_message')
  async handleAdminMessage(
    @MessageBody()
    data: { groupId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    // optionally admin auth verify karo; abhi simple
    const groupId = data.groupId;
    const msg = {
      id: Date.now().toString(),
      from: 'admin',
      text: data.text,
      groupId,
      createdAt: new Date().toISOString(),
    };

    const roomName = `group_${groupId}`;
    this.server.to(roomName).emit('group_message', msg);
  }
}
