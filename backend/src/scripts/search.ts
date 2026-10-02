import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import type { Chunk } from '../rag/chunker.js';
import { cosineSimilarity } from '../rag/similarity.js';

// Usage: npm run search -- "How many days can I work from home?"
const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.error('Usage: npm run search -- "your question"');
  process.exit(1);
}

const TOP_K = 3; // how many best-matching chunks to show
const INDEX_FILE = path.resolve('data', 'knowledge-index.json');

interface KnowledgeIndex {
  embeddingModel: string;
  chunks: (Chunk & { embedding: number[] })[];
}

const index = JSON.parse(await readFile(INDEX_FILE, 'utf8')) as KnowledgeIndex;
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  // Questions MUST use the same embedding model as the stored chunks.
  const model = app
    .get(ConfigService)
    .getOrThrow<string>('AZURE_OPENAI_EMBEDDING_DEPLOYMENT');
  if (model !== index.embeddingModel) {
    throw new Error(
      `Index was built with "${index.embeddingModel}" but config uses "${model}". Run: npm run ingest`,
    );
  }

  // 1. Turn the question into numbers
  const [questionVector] = await app.get(AzureOpenAiService).embed([question]);

  // 2. Compare with every stored chunk, 3. keep the closest ones
  const results = index.chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  console.log(`\n🔎 "${question}"\n`);
  results.forEach(({ chunk, score }, i) => {
    const preview = chunk.content
      .split('\n\n')
      .slice(1)
      .join(' ')
      .slice(0, 160);
    console.log(
      `${i + 1}. ${score.toFixed(3)}  ${chunk.documentId} → ${chunk.section}`,
    );
    console.log(`   "${preview}..."\n`);
  });
} finally {
  await app.close();
}
