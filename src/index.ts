import { Embedder } from './embeddings';
import { ChunkRepository } from './db/chunkRepository';
import { Ingestor } from './ingest';
import { closePool } from './db/pool';
import { Agent } from './agent';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const embedder = new Embedder();
  const chunkRepository = new ChunkRepository();

  if (command === 'ingest') {
    const ingestor = new Ingestor(embedder, chunkRepository);
    const dir = args[0] || './data';
    await ingestor.ingestDirectory(dir);
  }
  if (command === 'ask') {
    const agent = new Agent(embedder, chunkRepository);
    const question = args.join(' ');
    const answer = await agent.ask(question);
    console.log(JSON.stringify(answer, null, 2));
  } else {
    console.log('Usage: node index.js <command> [args]');
    console.log('Commands:');
    console.log(
      '  ingest <directory>  Ingest text files from the specified directory',
    );
    console.log(
      '  ask <question>      Ask a question and get an answer from the ingested data',
    );
  }

  await closePool();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
