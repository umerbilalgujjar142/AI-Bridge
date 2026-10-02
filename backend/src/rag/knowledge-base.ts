import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chunkMarkdown, type Chunk } from './chunker.js';

// Scripts run from backend/, so the knowledge base is ../docs/knowledge-base
export const KNOWLEDGE_BASE_DIR = path.resolve('..', 'docs', 'knowledge-base');

export interface KnowledgeDocument {
  file: string;
  chunks: Chunk[];
}

// Reads every Markdown file in the knowledge base and chunks it.
export async function loadKnowledgeBase(
  dir = KNOWLEDGE_BASE_DIR,
): Promise<KnowledgeDocument[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
  return Promise.all(
    files.map(async (file) => {
      const markdown = await readFile(path.join(dir, file), 'utf8');
      return {
        file,
        chunks: chunkMarkdown(path.basename(file, '.md'), markdown),
      };
    }),
  );
}
