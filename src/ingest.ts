import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Embedder } from './embeddings';
import { ChunkRepository } from './db/chunkRepository';

export class Ingestor {
  constructor(
    private embedder: Embedder,
    private chunkRepository: ChunkRepository,
  ) {}

  private splitTextIntoChunks(
    text: string,
    chunkSize = 500,
    overlap = 50,
  ): string[] {
    const chunks: string[] = [];
    for (let start = 0; start < text.length; start += chunkSize - overlap) {
      chunks.push(text.slice(start, start + chunkSize).trim());
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  async ingestDirectory(dir: string): Promise<void> {
    const files = (await readdir(dir)).filter((file) =>
      /\.(txt|md)$/.test(file),
    );

    for (const file of files) {
      const rawContent = await readFile(join(dir, file), 'utf-8');
      const chunks = this.splitTextIntoChunks(rawContent);
      const vectors = await this.embedder.embed(chunks);

      for (let i = 0; i < chunks.length; i++) {
        await this.chunkRepository.insertChunk(file, chunks[i], vectors[i]);
      }

      console.log(`Ingested ${chunks.length} chunks from ${file}`);
    }
  }
}
