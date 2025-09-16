import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KycService } from './kyc.service';
import { Kyc,KycSchema } from './entities/kyc.entity';
import { KycController } from './kyc.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Kyc.name, schema: KycSchema }]),
  ],
  controllers: [KycController], // Add controller here
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}