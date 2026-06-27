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
    overlap = 1,
  ): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+|\s*\S+\s*$/g) ?? [];
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let length = 0;

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      if (length + s.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = currentChunk.slice(-overlap);
        length = currentChunk.join(' ').length;
      }
      currentChunk.push(s);
      length += s.length;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
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
