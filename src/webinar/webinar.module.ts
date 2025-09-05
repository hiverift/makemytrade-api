import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebinarController } from './webinar.controller';
import { WebinarsService } from './webinar.service';
import { Webinar,WebinarSchema } from './entities/webinar.entity';
import { Category, CategorySchema } from 'src/categories/schemas/category.schema';
import { SubCategory, SubCategorySchema } from 'src/categories/schemas/subcategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webinar.name, schema: WebinarSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
    ]),
  ],
  controllers: [WebinarController],
  providers: [WebinarsService],
  exports: [WebinarsService],
})
export class WebinarsModule {}
