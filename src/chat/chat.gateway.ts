// src/chat/chat.gateway.ts
import { Logger } from '@nestjs/common';
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
import { PremiumGroupMessagesService } from 'src/premium-group/premium-group-message/premium-group-message.service';

interface AuthPayload {
  sub: string;
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

  // groupId -> Set<userId>
  private onlineUsersPerGroup = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly premiumGroupsService: PremiumGroupsService,
    private readonly messagesService: PremiumGroupMessagesService,
  ) {}

  private addOnlineUser(groupId: string, userId: string) {
    if (!this.onlineUsersPerGroup.has(groupId)) {
      this.onlineUsersPerGroup.set(groupId, new Set());
    }
    this.onlineUsersPerGroup.get(groupId)!.add(userId);
  }

  private removeOnlineUser(groupId: string, userId: string) {
    const set = this.onlineUsersPerGroup.get(groupId);
    if (!set) return;
    set.delete(userId);
    if (set.size === 0) {
      this.onlineUsersPerGroup.delete(groupId);
    }
  }

  private getOnlineUsers(groupId: string): string[] {
    return Array.from(this.onlineUsersPerGroup.get(groupId) || []);
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        (client.handshake.headers['authorization'] as string) ||
        (client.handshake.auth?.authorization as string);

      if (!authHeader || !authHeader.startsWith('Bearer')) {
        this.logger.warn('No auth token, disconnecting');
        client.disconnect();
        return;
      }

      const token = authHeader.replace('Bearer ', '').trim();

      const payload = this.jwtService.verify<AuthPayload>(token);
      const userId = payload.sub as string;
      this.logger.log('WebSocket connected userId=' + userId);

      const groupId = client.handshake.query.groupId as string;
      if (!groupId) {
        this.logger.warn('No groupId provided');
        client.disconnect();
        return;
      }

      const { hasAccess } = await this.premiumGroupsService.hasActiveAccess(
        userId,
        groupId,
      );
      if (!hasAccess) {
        this.logger.warn(
          `No active access for user ${userId} group ${groupId}`,
        );
        client.emit('access_denied', {
          message: 'Premium time expired or not purchased',
        });
        client.disconnect();
        return;
      }

      (client.data as any).userId = userId;
      (client.data as any).groupId = groupId;

      const roomName = `group_${groupId}`;
      client.join(roomName);

      this.addOnlineUser(groupId, userId);
      this.server.to(roomName).emit('online_users', {
        groupId,
        users: this.getOnlineUsers(groupId),
      });

      this.logger.log(
        `Client connected user=${userId} group=${groupId} socket=${client.id}`,
      );

      const messages = await this.messagesService.getGroupMessages(groupId, 50);
      client.emit('previous_messages', {
        groupId,
        messages,
      });
    } catch (err) {
      this.logger.error('handleConnection error', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as any)?.userId;
    const groupId = (client.data as any)?.groupId;

    if (userId && groupId) {
      this.removeOnlineUser(groupId, userId);
      const roomName = `group_${groupId}`;
      this.server.to(roomName).emit('online_users', {
        groupId,
        users: this.getOnlineUsers(groupId),
      });
    }

    this.logger.log(`Client disconnected ${client.id}`);
  }

  // 🔹 USER MESSAGE
  @SubscribeMessage('user_message')
  async handleUserMessage(
    @MessageBody()
    data: {
      text: string;
      tempId?: string;
      attachments?: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;

    if (!userId || !groupId) {
      return;
    }

    const saved = await this.messagesService.createMessage({
      groupId,
      from: 'user',
      userId,
      text: data.text,
      attachments: data.attachments,
    });

    if (!saved) {
      this.logger.error('Failed to create user message');
      return;
    }

    const savedAny = saved as any;
    const roomName = `group_${groupId}`;

    const msgPayload = {
      id: savedAny._id.toString(),
      from: savedAny.from,
      userId,
      groupId,
      text: savedAny.text,
      attachments: savedAny.attachments,
      createdAt: savedAny.createdAt,
      reactions: savedAny.reactions || [],
      readBy: savedAny.readBy || [],
      isDeleted: savedAny.isDeleted,
      tempId: data.tempId,
    };

    this.server.to(roomName).emit('group_message', msgPayload);
  }

  // 🔹 ADMIN MESSAGE
  @SubscribeMessage('admin_message')
  async handleAdminMessage(
    @MessageBody()
    data: {
      groupId: string;
      text: string;
      attachments?: string[];
      adminId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const groupId = data.groupId;

    const saved = await this.messagesService.createMessage({
      groupId,
      from: 'admin',
      adminId: data.adminId,
      text: data.text,
      attachments: data.attachments,
    });

    if (!saved) {
      this.logger.error('Failed to create admin message');
      return;
    }

    const savedAny = saved as any;
    const roomName = `group_${groupId}`;

    const msgPayload = {
      id: savedAny._id.toString(),
      from: savedAny.from,
      adminId: savedAny.adminId?.toString() || null,
      groupId,
      text: savedAny.text,
      attachments: savedAny.attachments,
      createdAt: savedAny.createdAt,
      reactions: savedAny.reactions || [],
      readBy: savedAny.readBy || [],
      isDeleted: savedAny.isDeleted,
    };

    this.server.to(roomName).emit('group_message', msgPayload);
  }

  // 🔹 EMOJI REACTION ADD
  @SubscribeMessage('add_reaction')
  async handleAddReaction(
    @MessageBody()
    data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const updated = await this.messagesService.addReaction(
      data.messageId,
      userId,
      data.emoji,
    );

    if (!updated) {
      this.logger.warn(
        `Message not found for add_reaction messageId=${data.messageId}`,
      );
      return;
    }

    const updatedAny = updated as any;
    const roomName = `group_${groupId}`;
    this.server.to(roomName).emit('message_reactions_updated', {
      messageId: updatedAny._id.toString(),
      reactions: updatedAny.reactions,
    });
  }

  // 🔹 EMOJI REACTION REMOVE
  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(
    @MessageBody()
    data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const updated = await this.messagesService.removeReaction(
      data.messageId,
      userId,
      data.emoji,
    );

    if (!updated) {
      this.logger.warn(
        `Message not found for remove_reaction messageId=${data.messageId}`,
      );
      return;
    }

    const updatedAny = updated as any;
    const roomName = `group_${groupId}`;
    this.server.to(roomName).emit('message_reactions_updated', {
      messageId: updatedAny._id.toString(),
      reactions: updatedAny.reactions,
    });
  }

  // 🔹 EDIT MESSAGE
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody()
    data: { messageId: string; newText: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const updated = await this.messagesService.editMessage(
      data.messageId,
      userId,
      data.newText,
    );

    if (!updated) {
      this.logger.warn(
        `Message not found for edit_message messageId=${data.messageId}`,
      );
      return;
    }

    const updatedAny = updated as any;
    const roomName = `group_${groupId}`;
    this.server.to(roomName).emit('message_edited', {
      messageId: updatedAny._id.toString(),
      text: updatedAny.text,
    });
  }

  // 🔹 DELETE MESSAGE (SOFT)
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody()
    data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const updated = await this.messagesService.softDeleteMessage(
      data.messageId,
      userId,
    );

    if (!updated) {
      this.logger.warn(
        `Message not found for delete_message messageId=${data.messageId}`,
      );
      return;
    }

    const updatedAny = updated as any;
    const roomName = `group_${groupId}`;
    this.server.to(roomName).emit('message_deleted', {
      messageId: updatedAny._id.toString(),
    });
  }

  // ✅ TYPING INDICATOR START
  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() _data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const roomName = `group_${groupId}`;

    client.to(roomName).emit('typing', {
      groupId,
      userId,
      isTyping: true,
    });
  }

  // ✅ TYPING INDICATOR STOP
  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() _data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const roomName = `group_${groupId}`;

    client.to(roomName).emit('typing', {
      groupId,
      userId,
      isTyping: false,
    });
  }

  // ✅ READ RECEIPT
  @SubscribeMessage('message_read')
  async handleMessageRead(
    @MessageBody()
    data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as any).userId as string;
    const groupId = (client.data as any).groupId as string;
    if (!userId || !groupId) return;

    const updated = await this.messagesService.markMessageRead(
      data.messageId,
      userId,
    );

    if (!updated) {
      this.logger.warn(
        `Message not found for message_read messageId=${data.messageId}`,
      );
      return;
    }

    const updatedAny = updated as any;
    const roomName = `group_${groupId}`;

    this.server.to(roomName).emit('message_read', {
      messageId: updatedAny._id.toString(),
      userId,
      readBy: updatedAny.readBy,
    });
  }
}
