import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
    }),
    StorageModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        region: config.get('LINODE_REGION'),
        accessKeyId: config.get('LINODE_KEY'),
        secretAccessKey: config.get('LINODE_SECRET'),
        bucket: config.get('LINODE_BUCKET'),
        endpoint: config.get('LINODE_ENDPOINT'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
