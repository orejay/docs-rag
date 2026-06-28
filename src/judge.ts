import { z } from 'zod';
import { chat } from './llm';

const Verdict = z.object({
  faithful: z.boolean(),
  reason: z.string(),
});

export type Verdict = z.infer<typeof Verdict>;

const SYSTEM = `You are a strict evaluator. Decide whether the ANSWER is fully supported by the CONTEXT.
Mark faithful=false if the answer states anything not present in the context, even if it sounds plausible or is true in general.
Mark faithful=true only if every claim in the answer is backed by the context.
Respond with JSON only: {"faithful": boolean, "reason": string}.`;

export async function judgeFaithfulness(
  question: string,
  context: string,
  answer: string,
): Promise<Verdict> {
  const raw = await chat(
    SYSTEM,
    `Question: ${question}\n\nContext:\n${context}\n\nAnswer:\n${answer}`,
  );
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return Verdict.parse(parsed);
}
