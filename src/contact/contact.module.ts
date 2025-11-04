import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact,ContactSchema } from './entities/contact.schema';
import { Enquiry,EnquirySchema } from './entities/rrp.schema';
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema },
    { name: Enquiry.name, schema: EnquirySchema }

    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}