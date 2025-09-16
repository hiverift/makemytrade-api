import { Controller, Get, Param, Patch, Body, Delete, UseGuards, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/decorators/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/decorators/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Admin can create any user (including admin)
  @Roles('admin','user')
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
  @Roles('admin','user')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin','user')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
