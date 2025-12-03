import { Controller, Post, Body, Param, UseGuards, Get, Patch, Delete, Query } from '@nestjs/common';
import { PremiumPlanService } from './premium-plan.service';
import { CreatePremiumPlanDto } from './dto/create-premium-plan.dto';
import { UpdatePremiumPlanDto } from './dto/update-premium-plan.dto';
import { JwtAuthGuard } from 'src/common/decorators/guards/jwt-auth.guard';

@Controller('plans')
export class PremiumPlanController {
  constructor(private readonly planService: PremiumPlanService) {}

  // Admin creates a plan for a group
  @Post()
  // @UseGuards(JwtAuthGuard)
  async create(@Param('groupId') groupId: string, @Body() dto: CreatePremiumPlanDto) {
    return this.planService.create(groupId, dto);
  }

  // Admin edits a plan
  @Patch(':planId')
  // @UseGuards(JwtAuthGuard)
  async update(@Param('planId') planId: string, @Body() dto: UpdatePremiumPlanDto) {
    return this.planService.update(planId, dto);
  }

  // Admin deletes a plan
  @Delete(':planId')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('planId') planId: string) {
    return this.planService.delete(planId);
  }

  // Public: list plans for a group (no admin required, client will call)
  @Get()
  // @UseGuards(JwtAuthGuard) // optional: require auth if you want
  async list(@Query('groupId') groupId: string) {
    console.log('Controller: Listing plans for groupId:', groupId);
    return this.planService.findByGroup(groupId);
  }
}
