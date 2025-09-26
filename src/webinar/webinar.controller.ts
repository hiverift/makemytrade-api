import {
  Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Put, Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WebinarsService } from './webinar.service';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { UpdateWebinarDto } from './dto/update-webinar.dto';

@Controller('webinars')
export class WebinarController {
  constructor(private readonly service: WebinarsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(@UploadedFile() thumbnail: Express.Multer.File, @Body() dto: CreateWebinarDto) {
    console.log('thumbnail from controller', thumbnail);
    return this.service.create(dto, thumbnail);
  }
  @Get('filter')
  async filter(@Query() query: any) {
    return this.service.filterWebinars(query);
  }
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: 'Upcoming' | 'Live' | 'Recorded') {
    return this.service.findByStatus(status);
  }

  // Removed category/subcategory-specific routes per request

  @Put(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(@Param('id') id: string, @UploadedFile() thumbnail: Express.Multer.File, @Body() dto: UpdateWebinarDto) {
    return this.service.update(id, dto, thumbnail);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // register attendee
  @Post(':id/register')
  register(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.registerAttendee(id, userId);
  }

  // get live details (stream url)
  @Get(':id/live')
  getLive(@Param('id') id: string) {
    return this.service.getLiveDetails(id);
  }

}
