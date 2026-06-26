import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

const client = new Anthropic();

export async function chat(system: string, user: string) {
  const message = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = message.content[0];

  return block.type === 'text' ? block.text : '';
}
