// src/premium-group/premium-group-message/premium-group-message.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PremiumGroupMessage, PremiumGroupMessageSchema } from '../premium-group-message/enties/premium-group-message.schema';
import { PremiumGroupMessagesService } from './premium-group-message.service';
import { PremiumGroupsModule } from 'src/premium-group/premium-group.module';
import { ChatGateway } from 'src/chat/chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PremiumGroupMessage.name, schema: PremiumGroupMessageSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lokeshkumar',
      signOptions: { expiresIn: '7d' },           
    }),
    forwardRef(() => PremiumGroupsModule),   
  ],
  providers: [
    PremiumGroupMessagesService,
    ChatGateway,                             
  ],
  exports: [PremiumGroupMessagesService, ChatGateway],
})
export class PremiumGroupMessageModule {}
