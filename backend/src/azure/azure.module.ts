import { Global, Module } from '@nestjs/common';
import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { AZURE_CREDENTIAL } from './azure.constants.js';
import { KeyVaultService } from './key-vault.service.js';

@Global()
@Module({
  providers: [
    {
      provide: AZURE_CREDENTIAL,
      useFactory: (): TokenCredential => new DefaultAzureCredential(),
    },
    KeyVaultService,
  ],
  exports: [AZURE_CREDENTIAL, KeyVaultService],
})
export class AzureModule {}
