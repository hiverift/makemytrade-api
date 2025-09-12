import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceItem,ServiceItemSchema } from './entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { BookingsService } from 'src/bookings/bookings.service';
import { BookingsModule } from 'src/bookings/bookings.module';

@Module({
  imports:[MongooseModule.forFeature([{name: ServiceItem.name, schema: ServiceItemSchema}])
,forwardRef(() => BookingsModule)

],
  providers:[ServicesService],
  controllers:[ServicesController],
  exports:[ServicesService, MongooseModule],
})
export class ServicesModule {}
