import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConsultanciesService } from './consultancies.service';
import { CreateConsultancyDto } from './dto/create-consultancy.dto';
import { UpdateConsultancyDto } from './dto/update-consultancy.dto';

@Controller('consultancies')
export class ConsultanciesController {
  constructor(private readonly service: ConsultanciesService) { }

  // ✅ Create consultancy (logo optional)
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @UploadedFile() logo: Express.Multer.File,
    @Body() dto: CreateConsultancyDto,
  ) {
    return this.service.create(dto, logo);
  }

  // ✅ Get all consultancies with pagination
  @Get('getAllConsultancy')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.service.findAll(Number(page), Number(limit));
  }

  // ✅ Get single consultancy by ID
  @Get('getSingleCosultancyById/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ✅ Get consultancy profile (detailed)
  @Get('profile/:id')
  profile(@Param('id') id: string) {
    return this.service.profile(id);
  }

  // ✅ Filter consultancies
  @Get('filterConsultancy')
  filter(@Query() q: any) {
    return this.service.filter(q);
  }

  // ✅ Update consultancy (logo optional)
  @Put('updateConsultancy/:id')
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param('id') id: string,
    @UploadedFile() logo: Express.Multer.File,
    @Body() dto: UpdateConsultancyDto,
  ) {
    return this.service.update(id, dto, logo);
  }

  // ✅ Delete consultancy
  @Delete('deleteConsultancy/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
