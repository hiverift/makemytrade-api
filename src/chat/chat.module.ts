// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
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
})
export class ChatModule {}
