import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faqs')
export class FaqsController {
  constructor(private readonly service: FaqsService) {}

  @Post()
  create(@Body() dto: CreateFaqDto) {
    return this.service.create(dto);
  }

  // optional query param ?active=true
  @Get()
  findAll(@Query('active') active?: string) {
    const onlyActive = active === 'true';
    return this.service.findAll(onlyActive);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // bulk reorder
  @Patch('reorder')
  reorder(@Body() items: { id: string; order: number }[]) {
    return this.service.reorder(items);
  }

  // toggle active (PATCH /faqs/:id/active?active=true)
  @Patch(':id/active')
  toggleActive(@Param('id') id: string, @Query('active') active: string) {
    const val = active === 'true';
    return this.service.toggleActive(id, val);
  }
}
