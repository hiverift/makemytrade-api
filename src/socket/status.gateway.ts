import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  // ✅ Jab User Connect karega (Online)
  async handleConnection(@ConnectedSocket() client: Socket) {
     const userId = client.handshake.query.userId as string;
    console.log(userId);
    if (!userId) return;
const objectId = new Types.ObjectId(userId);
    // Database me status update karein
  await this.userModel.findOneAndUpdate(
      { _id:objectId },
      { onlineStatus: true },
      { new: true }
    );

    console.log(`User ${userId} is Online`);
    this.server.emit('statusUpdated', { userId, online: true });
  }

  // ✅ Jab User Disconnect karega (Offline + Last Seen Update)
  async handleDisconnect(@ConnectedSocket() client: Socket) {
     const userId = client.handshake.query.userId as string;
    if (!userId) return;
   const objectId = new Types.ObjectId(userId);
    await this.userModel.findOneAndUpdate(
      {  _id:objectId },
      { onlineStatus: false, lastSeen: new Date() },
      { new: true }
    );

    console.log(`User ${userId} is Offline`);
    this.server.emit('statusUpdated', { userId, online: false });
  }
}
