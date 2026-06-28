CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
  id        bigserial PRIMARY KEY,
  source    text NOT NULL,
  content   text NOT NULL,
  embedding vector(384) NOT NULL
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin (content_tsv);