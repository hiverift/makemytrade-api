import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

export default {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const uri = config.get<string>('MONGO_URI');

    return {
      uri,
      // you can set dbName here if not included in URI
      dbName: config.get<string>('MONGO_DB') || undefined,
      retryAttempts: 5, // retries on failure
      retryDelay: 3000, // 3s delay between retries
      ssl: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout
    };
  },
} satisfies MongooseModuleAsyncOptions;
