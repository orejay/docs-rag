import { readFile } from 'node:fs/promises';
import { Embedder } from '../embeddings';
import { ChunkRepository } from '../db/chunkRepository';
import { closePool } from '../db/pool';
import { Agent } from '../agent';

type Case = { question: string; expect: string | null };

async function main() {
  const raw = await readFile('./src/evals/dataset.jsonl', 'utf-8');
  const cases: Case[] = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const agent = new Agent(new Embedder(), new ChunkRepository());
  let passed = 0;

  for (const { question, expect } of cases) {
    const result = await agent.ask(question);

    let pass: boolean;

    if (expect === null) {
      pass = !result.confident;
    } else {
      pass =
        result.answer.toLowerCase().includes(expect.toLowerCase()) &&
        result.confident;
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'} [confident=${result.confident}]: "Question: ${question}"`,
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
