import { Controller, Get, Param, Query, Patch, Body, Put, Request, Delete, UseGuards, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/decorators/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/decorators/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) { }

  // Admin can create any user (including admin)
  @Roles('admin', 'user')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  // Admin: list all users
  @Get()
  @Roles('admin', 'user')
  findAll() {
    return this.users.findAll();
  }

  // User/Admin: get by id
  @Get(':id')
  @Roles('admin', 'user')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }

  // Admin: update any user; User: can be implemented via /me in auth controller
  @Patch(':id')
  @Roles('admin', 'user')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'user')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
  @Get(':userId/assets')
  async getAssets(
    @Param('userId') userId: string,
    @Query('limit') limit = '50',
    @Query('skip') skip = '0',
  ) {
    const l = parseInt(limit as string, 10);
    const s = parseInt(skip as string, 10);
    return await this.users.getAssets(userId, l, s);
  }

  @Get(':userId/items-count')
  @Roles('admin', 'user')
  async getUserItemsCount(@Param('userId') userId: string) {
    return this.users.getUserItemsCount(userId);
  }

  @Get(':userId/:courseId/purchased-courses')
  async getPurchasedCourses(@Param('userId') userId: string, @Param('courseId') courseId: string, @Request() req) {
   return this.users.getPurchasedCourses(userId,courseId);
  }

  @Put('update-status/:phoneNumber')
  async updateStatus(@Param('phoneNumber') phoneNumber: string, @Body() statusDto: UpdateStatusDto) {
    return this.users.updateStatus(phoneNumber, statusDto);
  }


}
