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
import { ConsultanciesModule } from './consultancies/consultancies.module';
import { FaqsModule } from './faq/faqs.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { NotificationsModule } from './notificaions/notificaions.module';
import { DashboardServiceModule } from './dashboard-service/dashboard-service.module';
import { TransactionModule } from './transaction/transaction.module';
import { KycModule } from './kyc/kyc.module';
import { PaymentsModule } from './payment/payment.module';
import { OrdersModule } from './order/order.module';
import { YoutubeModule } from './youtube-tutorial/youtube.module';
import { MessageModule } from './message/message.module';
import { GoogleService } from './google/google.service';
import { GoogleModule } from './google/google.module';
import { PremiumGroupsModule } from './premium-group/premium-group.module';
import { PremiumGroupMessageModule } from './premium-group/premium-group-message/premium-group-message.module';
import { PremiumPlanModule } from './premium-plan/premium-plan.module';

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
    ConsultanciesModule,
    FaqsModule,
    BookingsModule,
    ServicesModule,
    NotificationsModule,
    DashboardServiceModule,
    TransactionModule,
    KycModule,
    OrdersModule,
    YoutubeModule,
    MessageModule,
    GoogleModule,
    PremiumGroupsModule,
    PremiumGroupMessageModule,
    PremiumPlanModule
  ],
  providers: [GoogleService],
})
export class AppModule {}
