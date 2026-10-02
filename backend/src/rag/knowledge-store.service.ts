import { Injectable } from '@nestjs/common';
import { PostgresService } from '../db/postgres.service.js';
import { CHUNKS_TABLE, toVectorLiteral } from '../db/db.constants.js';
import type { Chunk } from './chunker.js';

export interface SearchHit {
  id: string;
  documentId: string;
  title: string;
  section: string;
  content: string;
  score: number; // cosine similarity, 0..1 (higher = closer match)
}

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

@Injectable()
export class KnowledgeStore {
  constructor(private readonly db: PostgresService) {}

  // Replaces the whole index in one transaction: the table either ends up
  // matching docs/knowledge-base/ exactly, or is left untouched.
  async replaceAll(
    chunks: EmbeddedChunk[],
    embeddingModel: string,
  ): Promise<number> {
    return this.db.transaction(async (client) => {
      await client.query(`TRUNCATE ${CHUNKS_TABLE}`);
      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO ${CHUNKS_TABLE}
             (id, document_id, title, section, chunk_index, content, embedding, embedding_model)
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
          [
            chunk.id,
            chunk.documentId,
            chunk.title,
            chunk.section,
            chunk.chunkIndex,
            chunk.content,
            toVectorLiteral(chunk.embedding),
            embeddingModel,
          ],
        );
      }
      return chunks.length;
    });
  }

  // Nearest neighbours by cosine distance. <=> is pgvector's distance operator
  // (0 = identical direction), so similarity is 1 - distance.
  async search(questionVector: number[], topK = 3): Promise<SearchHit[]> {
    return this.db.query<SearchHit>(
      `SELECT id,
              document_id AS "documentId",
              title,
              section,
              content,
              1 - (embedding <=> $1::vector) AS score
         FROM ${CHUNKS_TABLE}
        ORDER BY embedding <=> $1::vector
        LIMIT $2`,
      [toVectorLiteral(questionVector), topK],
    );
  }

  // Guard against querying an index built with a different embedding model:
  // vectors from two models are not comparable, the scores would be nonsense.
  async getIndexedModel(): Promise<string | null> {
    const rows = await this.db.query<{ embedding_model: string }>(
      `SELECT DISTINCT embedding_model FROM ${CHUNKS_TABLE} LIMIT 1`,
    );
    return rows[0]?.embedding_model ?? null;
  }
}
