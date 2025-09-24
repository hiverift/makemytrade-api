import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YoutubeService } from './youtube.service';
import { YoutubeController } from './youtube.controller';
import { Youtube, YoutubeSchema } from './entities/youtube.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Youtube.name, schema: YoutubeSchema }])],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
