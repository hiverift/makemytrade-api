import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async signTokens(user: { _id: string; email: string; role: 'user' | 'admin' }) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };

    const access = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_TTL') ?? '15m',
    });

    const refresh = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('REFRESH_TOKEN_TTL') ?? '7d',
    });

    await this.users.setRefreshToken(user._id.toString(), refresh);

    return { accessToken: access, refreshToken: refresh };
  }

  async register(dto: RegisterDto) {
    try {
      const existing = await this.users.findByEmail(dto.email);
      if (existing) return new CustomError(403, 'Email already registered');

      const created = await this.users.create({ ...dto, role: 'user' });
      const user = await this.users.findByEmail(created.email);

      const tokens = await this.signTokens(user as any);

      return new CustomResponse(200, 'Registration successful', { user: created, ...tokens });
    } catch (e) {
      return new CustomError(500, 'Registration failed');
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.users.comparePassword(dto.email, dto.password);
      if (!user) {
        return new CustomError(401, 'Invalid credentials');
      }

      const tokens = await this.signTokens(user as any);
      const plain = (user as any).toObject?.() ?? user;
      delete plain.passwordHash;
      delete plain.refreshTokenHash;

      return new CustomResponse(200, 'Login successful', { user: plain, ...tokens });
    } catch (e) {
      return new CustomError(500, 'Login failed');
    }
  }

  async refresh(userId: string, refreshToken: string) {
    try {
      const valid = await this.users.validateRefreshToken(userId, refreshToken);
      if (!valid) return new CustomError(401, 'Invalid refresh token');

      const decoded = this.jwt.decode(refreshToken) as any;
      const tokens = await this.signTokens({
        _id: userId,
        email: decoded?.email,
        role: decoded?.role,
      });

      return new CustomResponse(200, 'Token refreshed successfully', tokens);
    } catch (e) {
      return new CustomError(500, 'Refresh failed');
    }
  }

  async logout(userId: string) {
    try {
      await this.users.setRefreshToken(userId, null);
      return new CustomResponse(200, 'Logged out successfully', { loggedOut: true });
    } catch (e) {
      return new CustomError(500, 'Logout failed');
    }
  }
}
