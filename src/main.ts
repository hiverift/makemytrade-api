import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

async function bootstrap() {
  try {
    // Load environment variables
    dotenv.config();
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const port = config.get<number>('PORT') ?? 4000;

    // Configure CORS to allow local and live frontends
    app.enableCors({
      origin: 'https://cakistockmarket.com',
      credentials: true,
    });

    // Set global API prefix
    app.setGlobalPrefix('api/v1');

    // Configure ValidationPipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: false, // Show validation errors
      }),
    );

    // Bind to 0.0.0.0 for external access
    await app.listen(port, '0.0.0.0');
    console.log(`API running on http://0.0.0.0:${port}/api/v1`);
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}
bootstrap();