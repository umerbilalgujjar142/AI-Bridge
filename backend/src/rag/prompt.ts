import type { SearchHit } from './knowledge-store.service.js';

// Grounding: the model may only use the retrieved chunks, never its own memory.
// Without these rules a model will happily blend real context with invented facts.
export const GROUNDED_SYSTEM_PROMPT = [
  'You are AI Bridge, an assistant that answers questions about Bridgeway Labs and its BridgeDesk product.',
  'Answer ONLY using the numbered context sections provided by the user message.',
  'If the context does not contain the answer, reply exactly: "I could not find that in the knowledge base."',
  'Never use outside knowledge and never guess. Do not mention that you were given context.',
  'Do not add citations or source markers — the application shows sources separately.',
  'Answer clearly and concisely — a short paragraph unless more detail is asked for.',
].join(' ');

// The reply sent when nothing in the knowledge base is close enough to the question.
export const NO_MATCH_ANSWER = 'I could not find that in the knowledge base.';

// Lays the retrieved chunks out as numbered sections, then repeats the question.
// Putting the question last keeps it in the model's most recent attention.
export function buildGroundedPrompt(
  question: string,
  hits: SearchHit[],
): string {
  const context = hits
    .map((hit, i) => `[${i + 1}] ${hit.title} — ${hit.section}\n${stripHeading(hit.content)}`)
    .join('\n\n---\n\n');

  return `Context sections:\n\n${context}\n\n---\n\nQuestion: ${question}`;
}

// Chunks are stored as "Title — Section\n\n<text>"; the heading is already
// printed above each section, so drop the duplicate copy.
function stripHeading(content: string): string {
  const [, ...body] = content.split('\n\n');
  return body.join('\n\n').trim() || content;
}
