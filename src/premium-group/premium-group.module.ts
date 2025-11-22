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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PremiumGroup.name, schema: PremiumGroupSchema },
      { name: PremiumGroupAccess.name, schema: PremiumGroupAccessSchema },
    ]),
  ],
  providers: [PremiumGroupsService],
  controllers: [PremiumGroupsController],
  exports: [PremiumGroupsService],
})
export class PremiumGroupsModule {}
