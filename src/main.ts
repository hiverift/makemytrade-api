import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  try {
    dotenv.config();

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const config = app.get(ConfigService);

    const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
    const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
    const isDev = nodeEnv !== 'production';

    console.log('Server Config:', { port, isDev, nodeEnv });

    app.set('trust proxy', 1);
    app.use(helmet());

    // Read allowed origins from env (comma-separated). Fallback to sensible defaults.
    const envOrigins = (process.env.ALLOWED_ORIGINS ?? '').trim();
    const defaultOrigins = isDev
      ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000']
      : ['https://cakistockmarket.com', 'https://www.cakistockmarket.com'];

    const allowedOrigins = envOrigins
      ? envOrigins.split(',').map((s) => s.trim()).filter(Boolean)
      : defaultOrigins;

    console.log('CORS allowed origins:', allowedOrigins);

    app.enableCors({
      origin: (origin, callback) => {
        // allow requests with no origin (curl, server-to-server). If you want to block them, change this.
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // not allowed
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
      ],
      maxAge: 86400,
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: false,
      }),
    );

    await app.listen(port, '0.0.0.0');
    console.log(`API running on http://localhost:${port}/api/v1`);
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}
bootstrap();
