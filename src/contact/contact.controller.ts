import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact-dto';


@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) { }

  @Post()
  createContact(@Body() dto: CreateContactDto) {
    return this.service.createContact(dto);
  }

  @Post('hiverift')
  createContactTohiverift(@Body() dto: CreateContactDto) {
    return this.service.createContactTohiverift(dto);
  }

  @Post('createRightPricePumpsContact')
  createRightPricePumpsContact(@Body() dto: any) {
    console.log('dot', dto)
    return this.service.createRightPricePumpsContact(dto);
  }

  @Get()
  getAllContacts() {
    return this.service.getAllContacts();
  }

  @Get(':id')
  getContactById(@Param('id') id: string) {
    return this.service.getContactById(id);
  }
}