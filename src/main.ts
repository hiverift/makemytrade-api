import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.enableCors({
    origin: '*', // allow all origins
    methods: '*', // allow all HTTP methods
    allowedHeaders: '*', // allow all headers
    credentials: true,
    preflightContinue: false, // let NestJS handle preflight automatically
    optionsSuccessStatus: 204, // response code for successful preflight
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes( new ValidationPipe({
      whitelist: true,
      transform: true,        
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}
bootstrap();
