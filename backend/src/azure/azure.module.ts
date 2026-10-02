import { Global, Module } from '@nestjs/common';
import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { AZURE_CREDENTIAL } from './azure.constants.js';
import { AzureOpenAiService } from './azure-openai.service.js';
import { KeyVaultService } from './key-vault.service.js';

@Global()
@Module({
  providers: [
    {
      provide: AZURE_CREDENTIAL,
      useFactory: (): TokenCredential => new DefaultAzureCredential(),
    },
    KeyVaultService,
    AzureOpenAiService,
  ],
  exports: [AZURE_CREDENTIAL, KeyVaultService, AzureOpenAiService],
})
export class AzureModule {}
