import { pool } from './pool';

export class ChunkRepository {
  private toVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  async insertChunk(
    source: string,
    content: string,
    embedding: number[],
  ): Promise<void> {
    const vector = this.toVector(embedding);
    await pool.query(
      'INSERT INTO chunks (source, content, embedding) VALUES ($1, $2, $3)',
      [source, content, vector],
    );
  }

  async nearestChunks(embedding: number[], limit: number): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT id, source, content, embedding, 1 - (embedding <=> $1) AS similarity
       FROM chunks
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [this.toVector(embedding), limit],
    );

    return rows as Array<{
      id: number;
      source: string;
      content: string;
      similarity: number;
    }>;
  }

  async keywordsSearch(query: string, limit: number): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT id, source, content, ts_rank(content_tsv, plainto_tsquery('english', $1)) AS rank
       FROM chunks
       WHERE content_tsv @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [query, limit],
    );

    return rows as Array<{
      id: number;
      source: string;
      content: string;
      rank: number;
    }>;
  }

  async hybridSearch(
    query: string,
    embedding: number[],
    limit: number,
  ): Promise<any[]> {
    const k = 60;
    const [vectorHits, keywordHits] = await Promise.all([
      this.nearestChunks(embedding, k),
      this.keywordsSearch(query, k),
    ]);

    const scores = new Map<
      string,
      { source: string; content: string; rrf: number }
    >();

    const fuse = (
      hits: Array<{ id: number; source: string; content: string }>,
    ) => {
      hits.forEach((hit, index) => {
        const key = hit.id.toString();
        const contribution = 1 / (k + index + 1);

        const existing = scores.get(key);
        if (existing) {
          existing.rrf += contribution;
        } else {
          scores.set(key, { ...hit, rrf: contribution });
        }
      });
    };

    fuse(vectorHits);
    fuse(keywordHits);

    return [...scores.values()].sort((a, b) => b.rrf - a.rrf).slice(0, limit);
  }

  async close(): Promise<void> {
    await pool.end();
  }
}
