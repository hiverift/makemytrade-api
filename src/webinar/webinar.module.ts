import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebinarController } from './webinar.controller';
import { WebinarsService } from './webinar.service';
import { Webinar,WebinarSchema } from './entities/webinar.entity';
import { Category, CategorySchema } from 'src/categories/schemas/category.schema';
import { SubCategory, SubCategorySchema } from 'src/categories/schemas/subcategory.schema';
import { Admin,AdminSchema } from 'src/users/entities/admin.entity';
import { GoogleModule } from 'src/google/google.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webinar.name, schema: WebinarSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    GoogleModule,
  ],
  controllers: [WebinarController],
  providers: [WebinarsService],
  exports: [WebinarsService],
})
export class WebinarsModule {}
