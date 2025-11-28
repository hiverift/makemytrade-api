import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact,ContactSchema } from './entities/contact.schema';
import { Enquiry,EnquirySchema } from './entities/rrp.schema';
import { DevineAutomationEnquiry,DevineAutomationEnquirySchema } from './entities/devine-automatin.schema';
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema },
    { name: Enquiry.name, schema: EnquirySchema },
     { name: DevineAutomationEnquiry.name, schema: DevineAutomationEnquirySchema },

    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}