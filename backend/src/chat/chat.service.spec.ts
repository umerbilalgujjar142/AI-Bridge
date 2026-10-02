import { describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service.js';
import type { AzureOpenAiService } from '../azure/azure-openai.service.js';
import type {
  KnowledgeStore,
  SearchHit,
} from '../rag/knowledge-store.service.js';
import { NO_MATCH_ANSWER } from '../rag/prompt.js';

function hit(section: string, score: number, content = 'Body text.'): SearchHit {
  return {
    id: `doc#0`,
    documentId: 'company-policies',
    title: 'Bridgeway Labs — Company Policies',
    section,
    content: `Bridgeway Labs — Company Policies — ${section}\n\n${content}`,
    score,
  };
}

// Keep references to the mock functions themselves, so assertions never read a
// method off the service object (that would be an unbound method reference).
function makeService(hits: SearchHit[]) {
  const embed = vi.fn().mockResolvedValue([[0.1, 0.2]]);
  const generate = vi.fn().mockResolvedValue('Up to 2 days per week.');
  const search = vi.fn().mockResolvedValue(hits);

  const ai = { embed, generate } as unknown as AzureOpenAiService;
  const store = { search } as unknown as KnowledgeStore;
  return { service: new ChatService(ai, store), embed, generate, search };
}

describe('ChatService (RAG)', () => {
  it('puts the retrieved chunk text into the prompt', async () => {
    const { service, generate } = makeService([
      hit('Remote Work', 0.56, 'Employees may work remotely up to 2 days per week.'),
    ]);

    await service.answerQuestion('How many days can I work from home?');

    const [systemPrompt, userPrompt] = generate.mock.calls[0] as [string, string];
    expect(userPrompt).toContain('Employees may work remotely up to 2 days per week.');
    expect(userPrompt).toContain('How many days can I work from home?');
    expect(systemPrompt).toContain('Answer ONLY using the numbered context sections');
  });

  it('returns the retrieved sections as citations', async () => {
    const { service } = makeService([hit('Remote Work', 0.564)]);

    const result = await service.answerQuestion('remote work?');

    expect(result.grounded).toBe(true);
    expect(result.sources).toEqual([
      {
        documentId: 'company-policies',
        title: 'Bridgeway Labs — Company Policies',
        section: 'Remote Work',
        score: 0.564,
      },
    ]);
  });

  it('skips the model call when nothing scores above the threshold', async () => {
    const { service, generate } = makeService([hit('Sick Leave', 0.12)]);

    const result = await service.answerQuestion('What is the weather in Tokyo?');

    expect(result).toEqual({ answer: NO_MATCH_ANSWER, sources: [], grounded: false });
    expect(generate).not.toHaveBeenCalled();
  });

  it('drops weak chunks but keeps strong ones from the same search', async () => {
    const { service } = makeService([
      hit('Remote Work', 0.56),
      hit('Sick Leave', 0.11),
    ]);

    const result = await service.answerQuestion('remote work?');

    expect(result.sources.map((s) => s.section)).toEqual(['Remote Work']);
  });

  it('collapses several chunks from one section into a single source', async () => {
    const { service, generate } = makeService([
      hit('Remote Work', 0.545, 'Up to 2 days per week.'),
      hit('Remote Work', 0.509, 'Managers may require more office days.'),
      hit('About This Handbook', 0.42),
    ]);

    const result = await service.answerQuestion('work from home policy?');

    // One entry per section, strongest score kept, still sorted by score.
    expect(result.sources.map((s) => [s.section, s.score])).toEqual([
      ['Remote Work', 0.545],
      ['About This Handbook', 0.42],
    ]);

    // Both Remote Work chunks still reach the model — only the citation collapses.
    const [, userPrompt] = generate.mock.calls[0] as [string, string];
    expect(userPrompt).toContain('Up to 2 days per week.');
    expect(userPrompt).toContain('Managers may require more office days.');
  });

  it('embeds the question before searching', async () => {
    const { service, embed, search } = makeService([hit('Remote Work', 0.56)]);

    await service.answerQuestion('remote work?');

    expect(embed).toHaveBeenCalledWith(['remote work?']);
    expect(search).toHaveBeenCalledWith([0.1, 0.2], 3);
  });
});
