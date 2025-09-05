import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoConfig from './config/mongo.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { CategoriesModule } from './categories/categories.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';    
import { ContactModule } from './contact/contact.module';
import { WebinarsModule } from './webinar/webinar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to the folder containing the uploaded images
    }),
    MongooseModule.forRootAsync(mongoConfig),
    AuthModule,
    UsersModule,
    CoursesModule,
    CategoriesModule,
    ContactModule,
    WebinarsModule,
  ],
})
export class AppModule {}
