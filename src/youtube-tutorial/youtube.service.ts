import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Youtube, YoutubeDocument } from './entities/youtube.entity';
import { CreateYoutubeDto } from './dto/create-youtube.dto';

@Injectable()
export class YoutubeService {
  constructor(@InjectModel(Youtube.name) private youtubeModel: Model<YoutubeDocument>) {}

  async create(dto: CreateYoutubeDto) {
    const newLink = new this.youtubeModel(dto);
    const saved = await newLink.save();

    return {
      status: 'success',
      message: 'YouTube link added successfully',
      data: saved,
    };
  }

  async findAll() {
    const all = await this.youtubeModel
      .find({}, { link: 1, category: 1, type: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .exec();

    const course = {
      live: all.filter((i) => i.category === 'course' && i.type === 'live').map((i) => i.link),
      offline: all.filter((i) => i.category === 'course' && i.type === 'offline').map((i) => i.link),
    };

    const webinar = {
      live: all.filter((i) => i.category === 'webinar' && i.type === 'live').map((i) => i.link),
      offline: all.filter((i) => i.category === 'webinar' && i.type === 'offline').map((i) => i.link),
    };

    return {
      status: 'success',
      message: 'Links fetched successfully',
      data: {
        course,
        webinar,
      },
    };
  }
}
