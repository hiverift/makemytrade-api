import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 4000;
  const isDev = config.get<string>('NODE_ENV') !== 'production';
  console.log(isDev, 'development');
   app.enableCors(
  isDev
    ? {
        origin: '*', // dev = allow all
      }
    : {
        origin: ['https://cosmiccloudmails.xyz'], // prod = allow only your site
        credentials: true,
      },
);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes( new ValidationPipe({
      whitelist: true,
      transform: true,        
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}
bootstrap();
