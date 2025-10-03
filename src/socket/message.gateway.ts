import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/message/message.service';
//import { FirebaseService } from 'src/services/firebase/firebase.service';
import { UsersService } from 'src/users/users.service';
import * as fs from 'fs';
import mongoose from 'mongoose';

import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import CustomResponse from 'src/providers/custom-response.service';
// import { StatusService } from 'src/upload-status/upload-status.service';
import { fileUpload } from 'src/util/fileupload';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private uploadPath = './uploads';
  private activeUsers = new Map<string, string>(); // Stores userId -> socketId mapping
  private activeCalls = new Map<string, { channelName: string, participants: string[], type: 'private' | 'group', groupId?: string }>(); // Tracks active calls

  constructor(
    private readonly messageService: MessageService,
    // private readonly firebaseService: FirebaseService,
    private readonly userService: UsersService
  ) {

    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }


  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    //const userId  = '681380ed4070dce916287b4e';
    console.log(` User Connected: ${userId}`);

    if (!userId) {
      console.log(' No userId provided. Disconnecting...');
      client.disconnect();
      return;
    }

    const user = await this.userService.findUserById(userId);
    if (!user) {
      console.log(` User not found in DB: ${userId}. Disconnecting...`);
      client.disconnect();
      return;
    }

    this.activeUsers.set(userId, client.id);
    console.log(' Active Users:', this.activeUsers);
  }

  async handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.activeUsers.entries()) {
      if (socketId === client.id) {
        this.activeUsers.delete(userId);
        await this.terminateUserCalls(userId);
        console.log(` User Disconnected: ${userId}`);
        break;
      }
    }
  }

  private async terminateUserCalls(userId: string) {
    for (const [channelName, call] of this.activeCalls.entries()) {
      if (call.participants.includes(userId)) {
        call.participants = call.participants.filter(id => id !== userId);
        if (call.participants.length === 0) {
          this.activeCalls.delete(channelName);
        } else {
          const endPayload = {
            status: 'ended',
            message: `User ${userId} left the call`,
            userId,
            channelName,
            timestamp: new Date().toISOString()
          };
          if (call.type === 'group' && call.groupId) {
            await this.server.to(call.groupId).emit('groupCallParticipantLeft', endPayload);
          } else {
            for (const participantId of call.participants) {
              const socketId = this.activeUsers.get(participantId);
              if (socketId) {
                await this.server.to(socketId).emit('callEnded', endPayload);
              }
            }
          }
        }
      }
    }
  }

  // @SubscribeMessage('sendMessage')
  // async handleMessage(client: Socket, payload: any) {
  //   console.log('New Message:', payload);

  //   const { senderId, receiverId, text, mediaType, fileData, caption, document_title, document_size, document_page } = payload; // Removed fileName

  //   // Validate payload
  //   if (!senderId || !receiverId || (!text && !mediaType)) {
  //     await client.emit('messageFailed', { message: 'Missing required fields: senderId, receiverId, or text/media' });
  //     return;
  //   }

  //   try {
  //     let mediaUrl: string | null = null;
  //     let messageType = text ? 'text' : 'media';

  //     // Handle media
  //     if (mediaType && fileData) {
  //       const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'application/pdf'];
  //       if (!allowedTypes.includes(mediaType)) {
  //         await client.emit('messageFailed', { message: 'Invalid media type' });
  //         return;
  //       }
  //       const fileBuffer = Buffer.from(fileData, 'base64');
  //       if (fileBuffer.length > 50 * 1024 * 1024) {
  //         await client.emit('messageFailed', { message: 'File size exceeds 50MB limit' });
  //         return;
  //       }

  //       // Generate filename
  //       const mediaTypeToExtension: { [key: string]: string } = {
  //         'image/jpeg': '.jpg',
  //         'image/png': '.png',
  //         'video/mp4': '.mp4',
  //         'audio/mpeg': '.mp3',
  //         'application/pdf': '.pdf',
  //       };
  //       const extension = mediaTypeToExtension[mediaType] || '.bin';
  //       const filename = `${Date.now()}-${uuidv4()}${extension}`; // e.g., 1623456789012-uuid.jpg

  //       // Save file
  //       const uploadPath = path.join(__dirname, '..', '..', 'public', 'Uploads/messageMedia');
  //       console.log('uploadPath:', uploadPath);
  //       const filePath = path.join(uploadPath, filename);
  //       if (!fs.existsSync(uploadPath)) {
  //         fs.mkdirSync(uploadPath, { recursive: true });
  //       }
  //       fs.writeFileSync(filePath, fileBuffer);
  //       console.log('filename:', filename);

  //       mediaUrl = `${process.env.SERVER_BASE_URL}Uploads/messageMedia/${filename}`;
  //       messageType = 'media';
  //     }

  //     // Create message
  //     const message = await this.messageService.createMessage({
  //       senderId,
  //       receiverId,
  //       chatId: `chat-${senderId}-${receiverId}`,
  //       text: text || null,
  //       mediaUrl,
  //       mediaType: mediaType || null,
  //       caption: caption || null,
  //       messageType,
  //       status: 'sent',
  //       document_title: document_title || null,
  //       document_size: document_size || null,
  //       document_page: document_page || null
  //     });

  //     // Enrich message
  //     const messageData = {
  //       _id: message._id.toString(),
  //       senderId: message.senderId,
  //       receiverId: message.receiverId,
  //       chatId: message.chatId,
  //       text: message.text,
  //       mediaUrl: message.mediaUrl,
  //       mediaType: message.mediaType,
  //       caption: message.caption,
  //       messageType: message.messageType,
  //       status: message.status,
  //       document_title: message.document_title || null,
  //       document_size: message.document_size || null,
  //       document_page: message.document_page || null

  //     };
  //     // Debug: Log messageData to verify
  //     console.log('messageData:', messageData);
  //     const sender = await this.userService.findUserById(receiverId); // Fixed: Use senderId, not receiverId
  //     console.log('sender', sender);
  //     const enrichedMessage = {
  //       ...messageData,
  //       receiverName: sender?.username ?? 'Unknown',
  //       receiverMobile: sender?.phoneNumber ?? 'Unknown',
  //       profilePicture: sender?.profilePicture ?? 'Unknown',
  //     };
  //     console.log('Sending message to receiver:', enrichedMessage);
  //     // Notify receiver
  //     const receiverSocket = this.activeUsers.get(receiverId);
  //     if (receiverSocket) {
  //       console.log('Sending message to receiver:', enrichedMessage);
  //       await this.server.to(receiverSocket).emit('newMessage', enrichedMessage);
  //       await this.messageService.updateStatus(message._id, 'delivered');
  //     }

  //     // Notify sender
  //     const senderSocket = this.activeUsers.get(senderId);
  //     if (senderSocket) {
  //       await this.server.to(senderSocket).emit('newMessage', enrichedMessage);
  //     }

  //     // Firebase notification
  //     if (!receiverSocket) {
  //       await this.firebaseService.sendNotification(
  //         receiverId,
  //         'New Message',
  //         mediaType ? `You received a ${mediaType} from ${sender?.username ?? 'Unknown'}` : (text || 'You have a new message'),
  //       );
  //     }

  //     await client.emit('messageSuccess', new CustomResponse(200, 'Message sent successfully', enrichedMessage));
  //   } catch (error) {
  //     console.log(`Failed to send message: ${error.message}`);
  //     await client.emit('messageFailed', { message: error.message });
  //   }
  // }




  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    console.log('New Message:', payload);

    const { senderId, receiverId, text, mediaUrl, mediaType, caption, document_titles, document_sizes, document_pages } = payload;

    // Validate payload
    if (!senderId || !receiverId || (!text && (!mediaUrl || !mediaUrl.length))) {
      await client.emit('messageFailed', { message: 'Missing required fields: senderId, receiverId, or text/media' });
      return;
    }

    try {
      // Set message type
      const messageType = mediaUrl && mediaUrl.length ? 'media' : 'text';

      // Create message
      const message = await this.messageService.createMessage({
        senderId,
        receiverId,
        chatId: `chat-${senderId}-${receiverId}`,
        text: text || null,
        mediaUrl: mediaUrl || [],
        mediaType: mediaType || [],
        caption: caption || null,
        messageType,
        status: 'sent',
        document_titles: document_titles || [],
        document_sizes: document_sizes || [],
        document_pages: document_pages || [],
      });

      // Enrich message
      const messageData = {
        _id: message._id.toString(),
        senderId: message.senderId,
        receiverId: message.receiverId,
        chatId: message.chatId,
        text: message.text,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        caption: message.caption,
        messageType: message.messageType,
        status: message.status,
        document_titles: message.document_titles,
        document_sizes: message.document_sizes,
        document_pages: message.document_pages,
      };

      console.log('messageData:', messageData);
      const sender = await this.userService.findUserById(senderId);
      console.log('sender', sender);
      const enrichedMessage = {
        ...messageData,
        receiverName: sender?.username ?? 'Unknown',
        receiverMobile: sender?.mobile ?? 'Unknown',
        profilePicture: sender?.profilePicture ?? 'Unknown',
      };
      console.log('Sending message to receiver:', enrichedMessage);

      // Notify receiver
      const receiverSocket = this.activeUsers.get(receiverId);
      if (receiverSocket) {
        console.log('enrick',enrichedMessage)
        await this.server.to(receiverSocket).emit('newMessage', enrichedMessage);
        await this.messageService.updateStatus(message._id, 'delivered');
      }

      // Notify sender
      const senderSocket = this.activeUsers.get(senderId);
      if (senderSocket) {
        await this.server.to(senderSocket).emit('newMessage', enrichedMessage);
      }

      // Firebase notification
      // if (!receiverSocket) {
      //   await this.firebaseService.sendNotification(
      //     receiverId,
      //     'New Message',
      //     mediaUrl && mediaUrl.length ? `You received media from ${sender?.username ?? 'Unknown'}` : (text || 'You have a new message'),
      //   );
      // }

      await client.emit('messageSuccess', new CustomResponse(200, 'Message sent successfully', enrichedMessage));
    } catch (error) {
      console.log(`Failed to send message: ${error.message}`);
      await client.emit('messageFailed', { message: error.message });
    }
  }


  @SubscribeMessage('createNewUser')
  async handleCreateNewUser(client: Socket, payload: any) {
    console.log(' New Message:', payload);

    const message = await this.messageService.createMessage({
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      text: payload.text,
      status: 'sent'
    });

    console.log('Saved Message:', message);

    const sender = await this.userService.findUserById(payload.senderId);
    const enrichedMessage = {
      ...message,
      senderUsername: sender?.mobile ?? 'Unknown',
      senderMobile: sender?.username ?? 'Unknown'
    };

    const receiverSocket = this.activeUsers.get(payload.receiverId);
    if (receiverSocket) {
      console.log('Sending message to receiver...');
      await this.server.to(receiverSocket).emit('newChatStart', enrichedMessage);
      await this.messageService.updateStatus(message._id, 'delivered');
    }

    const senderSocket = this.activeUsers.get(payload.senderId);
    if (senderSocket) {
      await this.server.to(senderSocket).emit('newMessage', enrichedMessage);
    }

    // if (!receiverSocket) {
    //   await this.firebaseService.sendNotification(
    //     payload.receiverId,
    //     'New Message',
    //     payload.text || 'You have a new message'
    //   );
    // }
  }

  @SubscribeMessage('fetchChatHistory')
  async handleChatHistory(client: Socket, payload: any) {
    const { senderId, receiverId, limit, skip } = payload;
    console.log(`Fetching chat history for ${senderId} & ${receiverId}`);
    const limitcheck = limit?.limit ?? 20;
     const skipcheck = skip?.skip ?? 0;
    const messages = await this.messageService.getMessages(senderId, receiverId, limitcheck, skipcheck);
    console.log('hidie', messages);
    await client.emit('chatHistory', messages);
  }

  @SubscribeMessage('updateStatus')
  async updateStatus(client: Socket, { messageId, status, senderId, receiverId }: { messageId: string, status: string, senderId: string, receiverId: string }) {
    console.log(` Updating message ${messageId} to status: ${status}`);

    await this.messageService.updateStatus(messageId, status);

    const senderSocket = this.activeUsers.get(senderId);
    if (senderSocket) {
      await this.server.to(senderSocket).emit('statusUpdate', { messageId, status });
    }

    const receiverSocket = this.activeUsers.get(receiverId);
    if (receiverSocket) {
      await this.server.to(receiverSocket).emit('statusUpdate', { messageId, status });
    }
  }

  @SubscribeMessage('fetchUserChats')
  async handleFetchUserChats(client: Socket, payload: any) {
    console.log(' Fetching user chats with payload:', payload);
    const { userId } = payload;
    console.log(` Fetching chats for user: ${userId}`);

    const chats = await this.messageService.getSidebarChats(userId);
    await client.emit('userChats', chats);
  }

 

  

    


  @SubscribeMessage('callRequest')
  async handleCallRequest(client: Socket, payload: any) {
    const { callerId, receiverId, channelName, callType = 'video' } = payload;
    const receiverSocket = this.activeUsers.get(receiverId);

    if (!receiverSocket) {
      console.log(`Receiver ${receiverId} is offline`);
      // await this.firebaseService.sendNotification(
      //   receiverId,
      //   'Missed Call',
      //   `You missed a ${callType} call from ${callerId}`
      // );
      await client.emit('userUnavailable', { receiverId });
      return;
    }

    for (const call of this.activeCalls.values()) {
      if (call.participants.includes(receiverId)) {
        await client.emit('userBusy', { receiverId });
        console.log(` Receiver ${receiverId} is busy`);
        return;
      }
    }

    this.activeCalls.set(channelName, {
      channelName,
      participants: [callerId],
      type: 'private'
    });

    const caller = await this.userService.findUserById(callerId);
    await this.server.to(receiverSocket).emit('incomingCall', {
      callerId,
      callerName: caller?.username ?? 'Unknown',
      channelName,
      callType,
      timestamp: new Date().toISOString()
    });
    console.log(` Call Request sent from ${callerId} to ${receiverId}`);
  }

  @SubscribeMessage('callAccepted')
  async handleCallAccepted(client: Socket, payload: any) {
    const { callerId, receiverId, channelName, callType } = payload;
    const callerSocket = this.activeUsers.get(callerId);
    const call = this.activeCalls.get(channelName);

    if (!call) {
      console.log(` Call ${channelName} not found`);
      await client.emit('callEnded', {
        channelName,
        message: 'Call no longer available'
      });
      return;
    }

    call.participants.push(receiverId);
    this.activeCalls.set(channelName, call);

    if (callerSocket) {
      const receiver = await this.userService.findUserById(receiverId);
      await this.server.to(callerSocket).emit('callAccepted', {
        receiverId,
        receiverName: receiver?.username ?? 'Unknown',
        channelName,
        callType,
        timestamp: new Date().toISOString()
      });
      console.log(`Call Accepted by ${receiverId} for ${callerId}`);
    }
  }

  @SubscribeMessage('callRejected')
  async handleCallRejected(client: Socket, payload: any) {
    const { callerId, receiverId, channelName } = payload;
    const callerSocket = this.activeUsers.get(callerId);

    this.activeCalls.delete(channelName);

    if (callerSocket) {
      await this.server.to(callerSocket).emit('callRejected', {
        receiverId,
        channelName,
        timestamp: new Date().toISOString()
      });
      console.log(` Call Rejected by ${receiverId}`);
    }

    await this.messageService.createMessage({
      senderId: callerId,
      receiverId,
      text: `Missed ${payload.callType || 'video'} call`,
      status: 'delivered',
      messageType: 'call'
    });
  }

  @SubscribeMessage('callEnded')
  handleCallEnded(client: Socket, payload: any) {
    try {
      const rawPayload = typeof payload[0] === 'string' ? JSON.parse(payload[0]) : payload;
      const { senderId, receiverId } = rawPayload;

      const peerSocketId = this.activeUsers.get(receiverId);
      const senderSocketId = this.activeUsers.get(senderId);
      const endPayload = {
        status: 'ended',
        message: 'Call has been ended',
        senderId,
        receiverId,
        timestamp: new Date().toISOString()
      };
      if (peerSocketId) {
        const check = this.server.to(peerSocketId).emit('callEndedUser', endPayload);
      } else {
        console.warn(` Receiver ${receiverId} not found in active users.`);
      }

      if (senderSocketId) {
        const check = this.server.to(senderSocketId).emit('callEndedUser', endPayload); // Send same structured payload
      }

    } catch (err) {
      console.error(' Error parsing payload or handling callEnded:', err);
    }
  }





  @SubscribeMessage('userBusy')
  async handleUserBusy(client: Socket, payload: any) {
    const { callerId, receiverId, channelName } = payload;
    const callerSocket = this.activeUsers.get(callerId);

    this.activeCalls.delete(channelName);

    if (callerSocket) {
      await this.server.to(callerSocket).emit('userBusy', { receiverId, channelName });
      console.log(` ${receiverId} is Busy`);
    }

    await this.messageService.createMessage({
      senderId: callerId,
      receiverId,
      text: `Missed ${payload.callType || 'video'} call`,
      status: 'delivered',
      messageType: 'call'
    });
  }

  @SubscribeMessage('notifyJoin')
  async handleNotifyJoin(client: Socket, payload: any) {
    const { userId, channelName } = payload;
    const call = this.activeCalls.get(channelName);

    if (call) {
      for (const participantId of call.participants) {
        if (participantId !== userId) {
          const socketId = this.activeUsers.get(participantId);
          if (socketId) {
            await this.server.to(socketId).emit('userJoinedChannel', { userId, channelName });
          }
        }
      }
      console.log(` ${userId} joined channel ${channelName}`);
    }
  }


 


  

  @SubscribeMessage('uploadMedia')
  async handleUploadMedia(client: Socket, payload: any) {
    const { senderId, receiverId, mediaType, fileData, fileName } = payload;

    if (!senderId || !receiverId || !mediaType || !fileData || !fileName) {
      console.log('Missing required fields for media upload');
      await client.emit('uploadMediaFailed', { message: 'Missing required fields: senderId, receiverId, mediaType, fileData, or fileName' });
      return;
    }

    try {
      // Decode base64 file data
      const fileBuffer = Buffer.from(fileData, 'base64');
      const filename = `${uuidv4()}-${fileName}`;
      const filePath = path.join(this.uploadPath, filename);
      fs.writeFileSync(filePath, fileBuffer);

      const mediaMessage = await this.messageService.createMessage({
        senderId,
        receiverId,
        mediaUrl: `/uploads/${filename}`,
        mediaType,
        status: 'sent',
        messageType: 'media',
      });

      const sender = await this.userService.findUserById(senderId);
      const enrichedMessage = {
        ...mediaMessage,
        senderUsername: sender?.mobile ?? 'Unknown',
        senderMobile: sender?.username ?? 'Unknown',
      };

      const receiverSocket = this.activeUsers.get(receiverId);
      if (receiverSocket) {
        console.log('Sending media message to receiver...', enrichedMessage);
        await this.server.to(receiverSocket).emit('newMessage', enrichedMessage);
        await this.messageService.updateStatus(mediaMessage._id, 'delivered');
      }

      const senderSocket = this.activeUsers.get(senderId);
      if (senderSocket) {
        console.log('hi', enrichedMessage)
        await this.server.to(senderSocket).emit('newMessage', enrichedMessage);
      }

      // if (!receiverSocket) {
      //   await this.firebaseService.sendNotification(
      //     receiverId,
      //     'New Media Message',
      //     `You received a ${mediaType} from ${sender?.username ?? 'Unknown'}`
      //   );
      // }

      await client.emit('uploadMediaSuccess', new CustomResponse(200, 'Media uploaded successfully', enrichedMessage));
    } catch (error) {
      console.log(`Failed to upload media: ${error.message}`);
      await client.emit('uploadMediaFailed', { message: error.message });
    }
  }

  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(client: Socket, { messageId, status, senderId, receiverId }: { messageId: string, status: string, senderId: string, receiverId: string }) {
    console.log(`Updating message ${messageId} to status: ${status}`);

    if (!['sent', 'delivered', 'seen'].includes(status)) {
      console.log('Invalid status provided');
      await client.emit('statusUpdateFailed', { messageId, message: 'Invalid status. Must be sent, delivered, or seen' });
      return;
    }

    try {
      await this.messageService.updateStatus(messageId, status);

      const senderSocket = this.activeUsers.get(senderId);
      if (senderSocket) {
        await this.server.to(senderSocket).emit('statusUpdate', { messageId, status });
      }

      const receiverSocket = this.activeUsers.get(receiverId);
      if (receiverSocket) {
        await this.server.to(receiverSocket).emit('statusUpdate', { messageId, status });
      }

      await client.emit('statusUpdateSuccess', { messageId, status });
    } catch (error) {
      console.log(`Failed to update status: ${error.message}`);
      await client.emit('statusUpdateFailed', { messageId, message: error.message });
    }
  }
  // @SubscribeMessage('getStatus')
  // async handleGetStatus(client: Socket, payload: any) {
  //   const statuses = await this.statusService.getStatusesForUser(payload.userId);
  //   client.emit('statusList', statuses);
  // }

  // @SubscribeMessage('markStatusSeen')
  // async handleSeen(client: Socket, payload: { userId: string; statusId: string }) {
  //   await this.statusService.markStatusSeen(payload.userId, payload.statusId);
  //   client.emit('statusSeen', { statusId: payload.statusId });
  // }
}