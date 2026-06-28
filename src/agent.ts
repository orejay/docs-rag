import { z } from 'zod';
import { chat } from './llm';
import { Embedder } from './embeddings';
import { ChunkRepository } from './db/chunkRepository';
import { config } from './config';

const AnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.object({ source: z.string(), quote: z.string() })),
  confident: z.boolean(),
});

export type Answer = z.infer<typeof AnswerSchema>;

const SYSTEM = `You answer strictly from the provided context.
If the context lacks the answer, set "confident" to false and say you don't know.
Respond with JSON only: {"answer": string, "citations": [{"source": string, "quote": string}], "confident": boolean}.
Every claim must be supported by a citation quoted from the context.`;

export class Agent {
  constructor(
    private embedder: Embedder,
    private chunkRepository: ChunkRepository,
  ) {}

  async ask(question: string): Promise<Answer> {
    const [queryVector] = await this.embedder.embed([question]);
    const hits = await this.chunkRepository.hybridSearch(
      question,
      queryVector,
      config.maxContextChunks,
    );

    const context = hits
      .map((chunk, i) => `[${i + 1}] Source: ${chunk.source}\n${chunk.content}`)
      .join('\n\n');

    const raw = await chat(
      SYSTEM,
      `Question: ${question}\n\nContext:\n${context}`,
    );
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return AnswerSchema.parse(parsed);
  }
}
