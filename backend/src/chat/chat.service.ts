import { Injectable, Logger } from '@nestjs/common';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';
import {
  KnowledgeStore,
  type SearchHit,
} from '../rag/knowledge-store.service.js';
import {
  buildGroundedPrompt,
  GROUNDED_SYSTEM_PROMPT,
  NO_MATCH_ANSWER,
} from '../rag/prompt.js';

export interface ChatSource {
  documentId: string;
  title: string;
  section: string;
  score: number;
}

export interface ChatAnswer {
  answer: string;
  sources: ChatSource[];
  grounded: boolean; // false = answered without any knowledge base match
}

const TOP_K = 3; // chunks pulled into the prompt: enough context, still cheap
// Cosine similarity below this means nothing in the knowledge base is about the
// question. Answering anyway is how a RAG bot starts making things up.
const MIN_SCORE = 0.3;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly ai: AzureOpenAiService,
    private readonly store: KnowledgeStore,
  ) {}

  // Phase 10 — RAG: embed the question, retrieve matching chunks, then let the
  // model answer using only those chunks.
  async answerQuestion(question: string): Promise<ChatAnswer> {
    // 1. Turn the question into a vector, using the same model as the chunks.
    const [questionVector] = await this.ai.embed([question]);

    // 2. Ask PostgreSQL for the closest chunks (HNSW index, cosine distance).
    const hits = await this.store.search(questionVector, TOP_K);
    const relevant = hits.filter((hit) => hit.score >= MIN_SCORE);

    // 3. Nothing close enough: answer without spending a model call.
    if (relevant.length === 0) {
      this.logger.log(
        `No match (best score ${hits[0]?.score.toFixed(3) ?? 'n/a'}, threshold ${MIN_SCORE})`,
      );
      return { answer: NO_MATCH_ANSWER, sources: [], grounded: false };
    }

    // 4. Put the chunks in the prompt and let the model write the answer.
    this.logger.log(
      `Retrieved ${relevant.length} chunks (best ${relevant[0].score.toFixed(3)}): ` +
        relevant.map((hit) => hit.section).join(', '),
    );
    const answer = await this.ai.generate(
      GROUNDED_SYSTEM_PROMPT,
      buildGroundedPrompt(question, relevant),
    );

    return { answer, sources: toSources(relevant), grounded: true };
  }
}

// Several chunks can come from the same section (a long section is split into
// parts). They all belong in the prompt, but as a *source* they are one entry —
// otherwise the UI shows the same section name twice.
function toSources(hits: SearchHit[]): ChatSource[] {
  const bySection = new Map<string, ChatSource>();
  for (const hit of hits) {
    const key = `${hit.documentId}#${hit.section}`;
    const existing = bySection.get(key);
    // Keep the strongest score for the section.
    if (!existing || hit.score > existing.score) {
      bySection.set(key, {
        documentId: hit.documentId,
        title: hit.title,
        section: hit.section,
        score: Number(hit.score.toFixed(3)),
      });
    }
  }
  return [...bySection.values()].sort((a, b) => b.score - a.score);
}
