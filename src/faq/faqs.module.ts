// src/faqs/faqs.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { Faq,FaqSchema } from './entities/faq.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faq.name, schema: FaqSchema }, // <- यह जरूरी है
    ]),
  ],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService], // अगर दूसरों modules में use करना हो
})
export class FaqsModule {}
