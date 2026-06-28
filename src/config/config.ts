import 'dotenv/config';

export const config = {
  anthropicModel: 'claude-haiku-4-5-20251001',
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  embeddingDim: 384,
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://rag:rag@localhost:5432/rag',
  maxContextChunks: 5,
};
