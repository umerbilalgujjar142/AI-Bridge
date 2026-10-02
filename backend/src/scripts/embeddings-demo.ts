import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';

// Cosine similarity: how closely two vectors point in the same direction.
// ~1.0 = very similar meaning, lower = less related.
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const question = 'How do I reset my password?';
const sentences = [
  "I forgot my login details and can't sign in.",
  'Steps to recover your account credentials.',
  'Our remote work policy allows two days per week.',
  'The weather in Lahore is hot today.',
  'Mein apna password bhool gaya hoon.'
];

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const ai = app.get(AzureOpenAiService);
  const [questionVector, ...sentenceVectors] = await ai.embed([
    question,
    ...sentences,
  ]);

  console.log(`\nQuestion: "${question}"`);
  console.log(`Vector dimensions: ${questionVector.length}`);
  console.log(
    `First 5 numbers  : [${questionVector
      .slice(0, 5)
      .map((n) => n.toFixed(4))
      .join(', ')}, ...]\n`,
  );

  const ranked = sentences
    .map((text, i) => ({
      text,
      score: cosineSimilarity(questionVector, sentenceVectors[i]),
    }))
    .sort((a, b) => b.score - a.score);

  console.log('Similarity to the question (higher = closer meaning):');
  for (const { text, score } of ranked) {
    const bar = '█'.repeat(Math.max(0, Math.round(score * 40))); // scores can be slightly negative
    console.log(`  ${score.toFixed(3)}  ${bar}  ${text}`);
  }
  console.log();
} finally {
  await app.close();
}
