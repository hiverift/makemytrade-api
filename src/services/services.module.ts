import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceItem,ServiceItemSchema } from './entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  imports:[MongooseModule.forFeature([{name: ServiceItem.name, schema: ServiceItemSchema}])],
  providers:[ServicesService],
  controllers:[ServicesController],
  exports:[ServicesService, MongooseModule],
})
export class ServicesModule {}
