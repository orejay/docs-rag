import { readFile } from 'node:fs/promises';
import { Embedder } from '../embeddings';
import { ChunkRepository } from '../db/chunkRepository';
import { closePool } from '../db/pool';
import { config } from '../config/config';

type Case = { question: string; expect: string | null };

const THRESHOLD = 0.5;

async function main() {
  const raw = await readFile('./src/evals/dataset.jsonl', 'utf-8');
  const cases: Case[] = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const embedder = new Embedder();
  const chunkRepository = new ChunkRepository();
  let passed = 0;

  for (const { question, expect } of cases) {
    const [vec] = await embedder.embed([question]);
    const nearestChunks = await chunkRepository.nearestChunks(
      vec,
      config.maxContextChunks,
    );
    const topScore = nearestChunks[0]?.similarity ?? 0;
    const joined = nearestChunks
      .map((chunk) => chunk.content.toLowerCase())
      .join(' ');

    let pass: boolean;

    if (expect === null) {
      pass = topScore < THRESHOLD;
    } else {
      pass = joined.includes(expect.toLowerCase());
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'} [top=${topScore.toFixed(2)}]: "Question: ${question}"`,
    );
    if (pass) {
      passed++;
    }
  }

  console.log(`\nPassed ${passed} / ${cases.length} cases`);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
