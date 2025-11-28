// src/premium-groups/premium-groups.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumGroupsService } from './premium-group.service';
import { PremiumGroupsController } from './premium-group.controller';
import { PremiumGroup,PremiumGroupSchema } from './entities/premium-group.entity';
import {
  PremiumGroupAccess,
  PremiumGroupAccessSchema,
} from './entities/premium-group-access.schema';
import { PremiumGroupMessageController } from './premium-group-message/premium-group-message.controller';
import { PremiumGroupMessagesService } from './premium-group-message/premium-group-message.service';
import { PremiumGroupMessageModule } from './premium-group-message/premium-group-message.module';
import { PremiumGroupMessage, PremiumGroupMessageSchema } from './premium-group-message/enties/premium-group-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PremiumGroup.name, schema: PremiumGroupSchema },
      { name: PremiumGroupAccess.name, schema: PremiumGroupAccessSchema },
      { name: PremiumGroup.name, schema: PremiumGroupSchema },
      { name: PremiumGroupMessage.name, schema: PremiumGroupMessageSchema },
    ]),
    PremiumGroupMessageModule,
  ],
  providers: [PremiumGroupsService, PremiumGroupMessagesService],
  exports: [PremiumGroupsService,PremiumGroupMessagesService],
})
export class PremiumGroupsModule {}
