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
    return this.service.createRightPricePumpsContact(dto);
  }

  @Post('devines-contact')
  devineAutomatinContact(@Body() dto: any) {
    return this.service.devineAutomatinContact(dto);
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