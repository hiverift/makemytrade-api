import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  // Admin
  @Post() create(@Body() dto: CreateServiceDto){ return this.svc.create(dto); }
  @Put(':id') update(@Param('id') id:string,@Body() dto:UpdateServiceDto){ return this.svc.update(id,dto); }
  @Delete(':id') remove(@Param('id') id:string){ return this.svc.remove(id); }

  // Public/Admin
  @Get() list(@Query('active') active?:string){ return this.svc.list(active==='true'); }
  @Get(':id') get(@Param('id') id:string){ return this.svc.get(id); }
}
