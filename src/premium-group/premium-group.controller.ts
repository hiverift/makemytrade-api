// src/premium-groups/premium-groups.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PremiumGroupsService } from './premium-group.service';
import { CreatePremiumGroupDto } from './dto/create-premium-group.dto';
import { UpdatePremiumGroupDto } from './dto/update-premium-group.dto';
import { BuyAccessDto } from './dto/buy-access.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@Controller()
export class PremiumGroupsController {
  constructor(private readonly service: PremiumGroupsService) {}

  // ---------- ADMIN ROUTES ----------
  @Post('admin/premium-groups')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  createGroup(@Body() dto: CreatePremiumGroupDto, @Req() req: any) {
    const adminId = req.user?.userId; // tumhare JWT payload me jo ho
    return this.service.createGroup(dto, adminId);
  }

  @Get('admin/premium-groups')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Patch('admin/premium-groups/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  updateGroup(@Param('id') id: string, @Body() dto: UpdatePremiumGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('admin/premium-groups/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }

  // ---------- USER ROUTES ----------

  // active premium groups list
  @Get('premium-groups')
  // @UseGuards(JwtAuthGuard)
  findAllActive() {
    return this.service.findAllActive();
  }

  // user buy access
  @Post('premium-groups/:id/buy')
  // @UseGuards(JwtAuthGuard)
  buyAccess(
    @Param('id') groupId: string,
    @Body() dto: BuyAccessDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    return this.service.buyAccess(userId, groupId, dto);
  }

  // check access for app
  @Get('premium-groups/:id/access')
  // @UseGuards(JwtAuthGuard)
  async checkAccess(@Param('id') groupId: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.service.hasActiveAccess(userId, groupId);
  }
}
