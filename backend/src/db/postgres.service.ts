import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBearerTokenProvider, type TokenCredential } from '@azure/identity';
import { Inject } from '@nestjs/common';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { AZURE_CREDENTIAL } from '../azure/azure.constants.js';

// Entra ID scope for Azure Database for PostgreSQL. The access token is used
// in place of a password, exactly like the keyless Azure OpenAI calls.
const POSTGRES_SCOPE = 'https://ossrdbms-aad.database.windows.net/.default';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor(
    config: ConfigService,
    @Inject(AZURE_CREDENTIAL) credential: TokenCredential,
  ) {
    const authMode = config.get<string>('PG_AUTH_MODE') ?? 'password';

    // "entra": no password exists at all. node-postgres calls this function for
    // every new connection, and getBearerTokenProvider caches the token until
    // it is close to expiry — so token refresh is handled for us.
    // "password": local development against the server admin login.
    const password =
      authMode === 'entra'
        ? getBearerTokenProvider(credential, POSTGRES_SCOPE)
        : config.getOrThrow<string>('PG_PASSWORD');

    this.logger.log(`Connecting to PostgreSQL using ${authMode} authentication`);

    this.pool = new Pool({
      host: config.getOrThrow<string>('PG_HOST'),
      port: config.getOrThrow<number>('PG_PORT'),
      user: config.getOrThrow<string>('PG_USER'),
      password,
      database: config.getOrThrow<string>('PG_DB'),
      // Azure PostgreSQL requires TLS. rejectUnauthorized keeps certificate
      // verification on, which is what makes the encryption actually safe.
      ssl: config.get<boolean>('PG_SSL') ? { rejectUnauthorized: true } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });

    // A pool keeps idle sockets open; a dropped one must not crash the process.
    this.pool.on('error', (err) =>
      this.logger.error(`Idle client error: ${err.message}`),
    );
  }

  async query<T extends QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    try {
      const result = await this.pool.query<T>(sql, params);
      return result.rows;
    } catch (err) {
      throw this.toHttpError(err);
    }
  }

  // Runs several statements on one client inside a transaction: all or nothing.
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw this.toHttpError(err);
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private toHttpError(err: unknown): unknown {
    const message = err instanceof Error ? err.message : String(err);
    // Log the database error, never the query parameters (they contain user text).
    this.logger.error(`PostgreSQL error: ${message}`);
    return new ServiceUnavailableException(
      'The knowledge database is unavailable right now.',
    );
  }
}
