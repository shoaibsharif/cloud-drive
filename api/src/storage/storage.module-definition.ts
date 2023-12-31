import { ConfigurableModuleBuilder } from '@nestjs/common';
import { registerOptions } from './contracts/storageOptions';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<registerOptions>().build();
