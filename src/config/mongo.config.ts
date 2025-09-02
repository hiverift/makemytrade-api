import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';

export default {
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => ({
    uri: config.get<string>('MONGO_URI'),
    dbName: undefined, // embedded in URI
  }),
  inject: [ConfigService],
} satisfies MongooseModuleAsyncOptions;
