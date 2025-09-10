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

    // Whitelist: dev और prod दोनों के लिए canonical origins डालो
    const allowedOrigins = isDev
      ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000']
      : ['https://cakistockmarket.com', 'https://www.cakistockmarket.com'];

    // Strict CORS: validate origin per request and echo exact origin for credentials
    app.enableCors({
      origin: (origin, callback) => {
        // अगर कोई non-browser request (server-to-server, curl) जिसमें Origin नहीं होता,
        // उन्हें allow करने के लिए null origin को true कर रहे हैं — यदि नहीं चाहिए तो change कर देना.
        if (!origin) {
          return callback(null, true);
        }

        // Debug log (optional) — हटाना चाहो तो comment कर दो
        if (!allowedOrigins.includes(origin)) {
          console.warn(`CORS blocked origin: ${origin}`);
          return callback(new Error('Not allowed by CORS'), false);
        }

        // Allowed origin -> pass true
        return callback(null, true);
      },
      credentials: true, // cookie/session भेजनी हो तो जरूरी
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
    console.log(`API running on http://0.0.0.0:${port}/api/v1`);
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}
bootstrap();
