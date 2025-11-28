import { Body, Controller,HttpCode, Post, UseGuards, Get, Param, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from 'src/common/decorators/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService,

    private readonly usersService: UsersService
  ) { }

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

   @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // returns 200 even if email not found to avoid user enumeration
    return this.usersService.createPasswordResetLink(dto.email);
  }

 @Post('reset-password')
async resetPassword(
  @Query('token') token: string,
  @Query('email') email: string,
  @Body() body: ResetPasswordDto,
) {
  const { newPassword } = body;
  return this.usersService.resetPassword(token, email, newPassword );
}




}