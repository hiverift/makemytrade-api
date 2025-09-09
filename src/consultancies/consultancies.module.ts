import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultanciesController } from './consultancies.controller';
import { ConsultanciesService } from './consultancies.service';
import { Consultancy,ConsultancySchema } from './entities/consultancy.entity';
import { Course, CourseSchema } from 'src/courses/schemas/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consultancy.name, schema: ConsultancySchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [ConsultanciesController],
  providers: [ConsultanciesService],
  exports: [ConsultanciesService],
})
export class ConsultanciesModule {}
