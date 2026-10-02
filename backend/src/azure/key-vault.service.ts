import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TokenCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { AZURE_CREDENTIAL } from './azure.constants.js';

@Injectable()
export class KeyVaultService {
  private readonly logger = new Logger(KeyVaultService.name);
  private readonly client: SecretClient;
  // Secrets are fetched once and reused: Key Vault has rate limits and each call adds latency.
  // Trade-off: a rotated secret is picked up on the next restart / new revision.
  private readonly cache = new Map<string, string>();

  constructor(
    @Inject(AZURE_CREDENTIAL) credential: TokenCredential,
    config: ConfigService,
  ) {
    this.client = new SecretClient(
      config.getOrThrow<string>('KEY_VAULT_URL'),
      credential,
    );
  }

  async getSecret(name: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached !== undefined) return cached;

    const secret = await this.client.getSecret(name); // latest version
    if (!secret.value) throw new Error(`Secret "${name}" has no value`);

    this.cache.set(name, secret.value);
    this.logger.log(`Loaded secret "${name}" from Key Vault`); // never log the value
    return secret.value;
  }
}
