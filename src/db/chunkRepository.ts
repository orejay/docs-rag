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
      `SELECT source, content, embedding, 1 - (embedding <=> $1) AS similarity
       FROM chunks
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [this.toVector(embedding), limit],
    );

    return rows as Array<{
      source: string;
      content: string;
      similarity: number;
    }>;
  }

  async close(): Promise<void> {
    await pool.end();
  }
}
