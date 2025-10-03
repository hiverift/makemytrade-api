import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message,MessageSchema } from './modal/message.schema';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { ChatGateway } from 'src/socket/message.gateway';
// import { FirebaseService } from 'src/services/firebase/firebase.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
// import { StatusModule } from 'src/upload-status/upload-status.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }
    ]),UsersModule ],
  providers: [MessageService, ChatGateway],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
