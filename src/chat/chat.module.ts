// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from 'src/socket/message.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PremiumGroupsModule } from 'src/premium-group/premium-group.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'lokeshkumar', // actual secret / config use karo
    }),
    PremiumGroupsModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
