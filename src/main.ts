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
    const isDev = config.get<string>('NODE_ENV') !== 'production';

    // Log environment for debugging
    console.log('Server Config:', {
      port,
      isDev,
      nodeEnv: config.get<string>('NODE_ENV'),
    });

    // Configure CORS to allow local and live frontends
    app.enableCors({
      origin: isDev
        ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'] // Add your local frontend ports
        : ['https://cakistockmarket.com', 'http://69.62.78.239:4000'], // Live frontend and direct IP
      credentials: true, // Allow cookies/headers if needed
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Expl icitly allow methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allow common headers
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