import { Controller, Post,UseInterceptors,UploadedFile, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDto } from 'src/categories/dto/create-category.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Post('createCrouses')
  @UseInterceptors(FileInterceptor('image'))
  async create(
     @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateCourseDto,
  ) {
     console.log('image from controller ',image)
     return this.service.create(dto, image);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('category/:id')
  findByCategory(@Param('id') categoryId: string) {
    return this.service.findByCategory(categoryId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
