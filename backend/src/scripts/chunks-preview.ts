import { loadKnowledgeBase } from '../rag/knowledge-base.js';

const documents = await loadKnowledgeBase();
let total = 0;

for (const { file, chunks } of documents) {
  total += chunks.length;
  console.log(`\n📄 ${file}  →  ${chunks.length} chunks`);
  for (const chunk of chunks) {
    console.log(
      `   #${String(chunk.chunkIndex).padEnd(3)} ${String(chunk.content.length).padStart(5)} chars   ${chunk.section}`,
    );
  }
}

console.log(`\nTotal: ${total} chunks from ${documents.length} documents\n`);
