import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import { KnowledgeStore } from '../rag/knowledge-store.service.js';

// Usage: npm run search -- "How many days can I work from home?"
const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.error('Usage: npm run search -- "your question"');
  process.exit(1);
}

const TOP_K = 3; // how many best-matching chunks to show

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const store = app.get(KnowledgeStore);
  const model = app
    .get(ConfigService)
    .getOrThrow<string>('AZURE_OPENAI_EMBEDDING_DEPLOYMENT');

  // Questions MUST use the same embedding model as the stored chunks.
  const indexedModel = await store.getIndexedModel();
  if (indexedModel === null) {
    throw new Error('The knowledge_chunks table is empty. Run: npm run ingest');
  }
  if (indexedModel !== model) {
    throw new Error(
      `Index was built with "${indexedModel}" but config uses "${model}". Run: npm run ingest`,
    );
  }

  // 1. Turn the question into numbers
  const [questionVector] = await app.get(AzureOpenAiService).embed([question]);

  // 2 + 3. PostgreSQL finds the closest chunks (HNSW index, cosine distance)
  const results = await store.search(questionVector, TOP_K);

  console.log(`\n🔎 "${question}"\n`);
  results.forEach((hit, i) => {
    const preview = hit.content.split('\n\n').slice(1).join(' ').slice(0, 160);
    console.log(
      `${i + 1}. ${hit.score.toFixed(3)}  ${hit.documentId} → ${hit.section}`,
    );
    console.log(`   "${preview}..."\n`);
  });
} finally {
  await app.close();
}
