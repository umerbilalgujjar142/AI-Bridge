import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PostgresService } from '../db/postgres.service.js';
import { CHUNKS_TABLE } from '../db/db.constants.js';

// Usage: npm run db:peek            → summary + first rows of every document
//        npm run db:peek -- azure   → only chunks whose document id matches "azure"
const filter = process.argv.slice(2).join(' ').trim();

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const db = app.get(PostgresService);

  const totals = await db.query<{
    document_id: string;
    title: string;
    chunks: number;
    model: string;
  }>(
    `SELECT document_id, title, count(*)::int AS chunks, max(embedding_model) AS model
       FROM ${CHUNKS_TABLE}
      GROUP BY document_id, title
      ORDER BY document_id`,
  );

  if (totals.length === 0) {
    console.log('\n⚠️  knowledge_chunks is empty. Run: npm run ingest\n');
  } else {
    console.log('\n📊 Stored documents\n');
    for (const row of totals) {
      console.log(
        `   ${row.document_id.padEnd(18)} ${String(row.chunks).padStart(3)} chunks   ${row.model}   "${row.title}"`,
      );
    }

    // The embedding is 1536 numbers — print only the first few so the row stays readable.
    const rows = await db.query<{
      id: string;
      section: string;
      preview: string;
      dims: number;
      head: string;
    }>(
      `SELECT id,
              section,
              left(regexp_replace(content, E'\\n+', ' ', 'g'), 70) AS preview,
              vector_dims(embedding) AS dims,
              left(embedding::text, 34) AS head
         FROM ${CHUNKS_TABLE}
        WHERE ($1 = '' OR document_id ILIKE '%' || $1 || '%')
        ORDER BY document_id, chunk_index
        LIMIT 20`,
      [filter],
    );

    console.log(`\n🧩 Chunks${filter ? ` matching "${filter}"` : ''}\n`);
    for (const row of rows) {
      console.log(`   ${row.id}  →  ${row.section}`);
      console.log(`      text   : ${row.preview}...`);
      console.log(`      vector : ${row.head}...]  (${row.dims} dims)\n`);
    }
  }
} finally {
  await app.close();
}
