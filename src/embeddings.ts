import { pipeline } from '@huggingface/transformers';
import { config } from './config/config';
import { normalize } from 'node:path';

export class Embedder {
  private extractor: any = null;

  private async loadExtractor() {
    if (!this.extractor)
      this.extractor = await pipeline(
        'feature-extraction',
        config.embeddingModel,
      );

    return this.extractor;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = await this.loadExtractor();

    const output = await model(texts, { pooling: 'mean', normalize: true });

    return output.tolist();
  }
}
