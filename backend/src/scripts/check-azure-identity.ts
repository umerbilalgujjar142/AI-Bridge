import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { TokenCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { AppModule } from '../app.module.js';
import { AZURE_CREDENTIAL } from '../azure/azure.constants.js';

// Starts Nest WITHOUT an HTTP server and uses the same injected credential as the app.
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const credential = app.get<TokenCredential>(AZURE_CREDENTIAL);
  const config = app.get(ConfigService);

  // 1. AUTHENTICATION: ask Entra ID for a token to call Azure Resource Manager
  const token = await credential.getToken(
    'https://management.azure.com/.default',
  );
  if (!token) throw new Error('No token returned');

  // Decode the token's payload (middle part of the JWT) to see WHO it was issued to.
  // For learning only: never log the token itself.
  const claims = JSON.parse(
    Buffer.from(token.token.split('.')[1], 'base64url').toString(),
  );
  console.log('✅ Authenticated');
  console.log(
    '   identity :',
    claims.upn ?? claims.unique_name ?? claims.appid,
  );
  console.log('   objectId :', claims.oid);
  console.log(
    '   expires  :',
    new Date(token.expiresOnTimestamp).toISOString(),
  );

  // 2. AUTHORIZATION: use that identity to read the resource group (RBAC decides)
  const client = new ResourceManagementClient(
    credential,
    config.getOrThrow<string>('AZURE_SUBSCRIPTION_ID'),
  );
  const rg = await client.resourceGroups.get(
    config.getOrThrow<string>('AZURE_RESOURCE_GROUP'),
  );
  console.log('✅ Authorized: read resource group');
  console.log('   name     :', rg.name);
  console.log('   location :', rg.location);
  console.log('   tags     :', rg.tags);
} finally {
  await app.close();
}
