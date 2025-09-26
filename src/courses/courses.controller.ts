import { Controller, Query, Post, UseInterceptors, UploadedFile, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) { }

  @Post('createCrouses')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateCourseDto,
  ) {
    console.log('image from controller ', image);
    return this.service.create(dto, image);
  }

  @Get('getAllCourses')
  findAll() {
    return this.service.findAll();
  }

  @Get('getCoursesById/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // Removed category/subcategory-specific endpoints per request

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.service.update(id, dto, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('filter')
  async filter(@Query() query: any) {
    return this.service.filterCourses(query);
  }
}
