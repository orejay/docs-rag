# docs-rag

## What it is

A RAG CLI agent that answers questions grounded in your own text documents, with citations.

## How to run it

- Install prerequisites `Node v20` upwards
- Run `npm install` to install dependencies
- Start DB with `docker compose up -d`
- Ingest context files, run `npm run ingest <directory>` (defaults to `./data`)
- Ask questions, run `npm run ask "your question"`

## How it works

### Ingestion

The ingest command calls `ingestor.ingestDirectory(<file path>)`, splits the text content into chunks and then embeds the chunks converting them into a vector array. The vectors are then stored on the DB alongside the source and text.

### Retrieval and answering

When a question is asked the agent embeds the question and queries the db for the most similar chunks. It then builds those chunks into numbered context and feeds them to the llm alongside the question and system prompts (guardrails). The answer is returned on the CLI.

If the answer isn't in the retrieved context, the agent returns confident: false instead of hallucinating.

## Design decisions

Components (Agent, Ingestor) receive their dependencies via the constructor (dependency injection) and are composed of collaborators rather than extending base classes (composition over inheritance). This keeps them swappable and unit-testable e.g. an in-memory repository can replace Postgres in tests.

## Tech

- TypeScript
- Anthropic for generation
- local Transformers.js embeddings
- Postgres + pgvector.

## What's next

Better chunking + an eval suite.
