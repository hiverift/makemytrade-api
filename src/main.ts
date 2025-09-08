import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import helmet from 'helmet'; // default import works better with types
import { NestExpressApplication } from '@nestjs/platform-express'; // 👈 import this

async function bootstrap() {
  try {
    dotenv.config();

    // 👇 tell Nest that we want an Express app
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const config = app.get(ConfigService);

    const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
    const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
    const isDev = nodeEnv !== 'production';

    console.log('Server Config:', { port, isDev, nodeEnv });

    // Express-specific settings now work
    app.set('trust proxy', 1);

    // Security headers
    app.use(helmet());

    const allowedOrigins = isDev
      ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000']
      : [
          'https://cakistockmarket.com',
          'https://www.cakistockmarket.com',
        ];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
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
    console.log(`API running on http://0.0.0.0:${port}/api/v1`);
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}
bootstrap();
