import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import { cosineSimilarity } from '../rag/similarity.js';

const question = 'How do I reset my password?';
const sentences = [
  "I forgot my login details and can't sign in.",
  'Steps to recover your account credentials.',
  'Our remote work policy allows two days per week.',
  'The weather in Lahore is hot today.',
  'Mein apna password bhool gaya hoon.',
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
