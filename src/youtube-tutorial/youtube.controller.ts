import { Controller, Get, Post, Body } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { CreateYoutubeDto } from './dto/create-youtube.dto';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Post()
  create(@Body() dto: CreateYoutubeDto) {
    return this.youtubeService.create(dto);
  }

  @Get()
  findAll() {
    return this.youtubeService.findAll();
  }
}
