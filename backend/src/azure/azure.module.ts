import { Global, Module } from '@nestjs/common';
import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { AZURE_CREDENTIAL } from './azure.constants.js';

@Global()
@Module({
  providers: [
    {
      provide: AZURE_CREDENTIAL,
      useFactory: (): TokenCredential => new DefaultAzureCredential(),
    },
  ],
  exports: [AZURE_CREDENTIAL],
})
export class AzureModule {}
