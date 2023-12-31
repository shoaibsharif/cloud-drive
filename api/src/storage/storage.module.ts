import { Global, Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { ConfigurableModuleClass } from './storage.module-definition';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
  controllers: [StorageController],
})
export class StorageModule extends ConfigurableModuleClass {}
