import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import { loadKnowledgeBase } from '../rag/knowledge-base.js';
import { KnowledgeStore } from '../rag/knowledge-store.service.js';

// Phase 9: read → chunk → embed → store in PostgreSQL (pgvector).
// Re-running replaces the whole index, so the table always mirrors docs/knowledge-base/.
const BATCH_SIZE = 16; // texts per embedding call: fewer calls, stays well under request limits

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['log', 'error', 'warn'],
});

try {
  const ai = app.get(AzureOpenAiService);
  const store = app.get(KnowledgeStore);
  const embeddingModel = app
    .get(ConfigService)
    .getOrThrow<string>('AZURE_OPENAI_EMBEDDING_DEPLOYMENT');

  // 1 + 2. Read and chunk every document
  const documents = await loadKnowledgeBase();
  const chunks = documents.flatMap((d) => d.chunks);
  console.log(`\n📚 ${documents.length} documents → ${chunks.length} chunks\n`);

  // 3. Embed the chunks in batches
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    embeddings.push(...(await ai.embed(batch.map((c) => c.content))));
  }

  // 4. Replace the stored index in one transaction
  const embedded = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
  const stored = await store.replaceAll(embedded, embeddingModel);

  console.log(
    `\n✅ Stored ${stored} chunks × ${embeddings[0].length} dimensions in PostgreSQL`,
  );
  console.log(`   model : ${embeddingModel}`);
  console.log(`   table : knowledge_chunks\n`);
} finally {
  await app.close();
}
