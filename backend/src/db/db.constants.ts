// text-embedding-3-small produces 1536 numbers per text.
// The column type vector(1536) is fixed at creation, so changing the embedding
// model means recreating the table (npm run db:init).
export const EMBEDDING_DIMENSIONS = 1536;

export const CHUNKS_TABLE = 'knowledge_chunks';

// pgvector accepts a vector literal as the string "[0.1,0.2,...]".
// Always bind it to a parameter and cast with $n::vector.
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
