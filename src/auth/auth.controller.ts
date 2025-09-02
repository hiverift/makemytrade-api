import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from 'src/common/decorators/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

    @Post('refresh')
    refresh(@Body() dto: RefreshDto, @CurrentUser('userId') userId?: string) {
      // If you want refresh without auth header, parse ID from token instead.
      // Simpler: expect userId packed in token; we'll decode inside service.
      const decoded: any = undefined;

      return this.auth.refresh(decoded?.sub ?? dto.userId ?? '', dto.refreshToken);
    }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser('userId') userId: string) {
    return this.auth.logout(userId);
  }
}
