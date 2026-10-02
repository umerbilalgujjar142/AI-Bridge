import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PostgresService } from '../db/postgres.service.js';
import { CHUNKS_TABLE, EMBEDDING_DIMENSIONS } from '../db/db.constants.js';

// Phase 9: creates the vector table. Safe to re-run — nothing is dropped.
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const db = app.get(PostgresService);

  // pgvector adds the "vector" column type and the <=> distance operators.
  await db.query('CREATE EXTENSION IF NOT EXISTS vector');

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${CHUNKS_TABLE} (
      id              TEXT PRIMARY KEY,
      document_id     TEXT NOT NULL,
      title           TEXT NOT NULL,
      section         TEXT NOT NULL,
      chunk_index     INTEGER NOT NULL,
      content         TEXT NOT NULL,
      embedding       VECTOR(${EMBEDDING_DIMENSIONS}) NOT NULL,
      embedding_model TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // HNSW index for cosine distance (<=>). Without it Postgres compares the
  // question against every row; with it, only a small neighbourhood.
  await db.query(`
    CREATE INDEX IF NOT EXISTS ${CHUNKS_TABLE}_embedding_idx
      ON ${CHUNKS_TABLE}
      USING hnsw (embedding vector_cosine_ops)
  `);

  const [{ extversion }] = await db.query<{ extversion: string }>(
    `SELECT extversion FROM pg_extension WHERE extname = 'vector'`,
  );
  const [{ count }] = await db.query<{ count: string }>(
    `SELECT count(*)::int AS count FROM ${CHUNKS_TABLE}`,
  );

  console.log(`\n✅ Schema ready`);
  console.log(`   pgvector : ${extversion}`);
  console.log(`   table    : ${CHUNKS_TABLE} (vector(${EMBEDDING_DIMENSIONS}), HNSW cosine index)`);
  console.log(`   rows     : ${count}\n`);
} finally {
  await app.close();
}
