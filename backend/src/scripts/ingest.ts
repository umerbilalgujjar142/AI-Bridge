import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import { loadKnowledgeBase } from '../rag/knowledge-base.js';

// Phase 8: store the index in a local JSON file so we can look at it.
// Phase 9 replaces this with a real vector database (PostgreSQL + pgvector).
const OUTPUT_FILE = path.resolve('data', 'knowledge-index.json');
const BATCH_SIZE = 16; // texts per embedding call: fewer calls, stays well under request limits

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['log', 'error', 'warn'],
});

try {
  const ai = app.get(AzureOpenAiService);
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

  // 4. Store chunk + embedding + metadata
  const index = {
    embeddingModel, // questions MUST be embedded with this same model later
    dimensions: embeddings[0].length,
    createdAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] })),
  };
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(index));

  console.log(
    `\n✅ Stored ${index.chunks.length} chunks × ${index.dimensions} dimensions`,
  );
  console.log(`   model : ${embeddingModel}`);
  console.log(`   file  : ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);
} finally {
  await app.close();
}
