import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { CLIENTE_OPENAI } from './cliente-openai';

/** Limite da API da OpenAI por requisição de embeddings. */
const MAX_POR_LOTE = 100;

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly modelo: string;
  private readonly dimensoes: number;

  constructor(
    @Inject(CLIENTE_OPENAI) private readonly openai: OpenAI,
    config: ConfigService,
  ) {
    this.modelo =
      config.get<string>('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';
    this.dimensoes = config.get<number>('OPENAI_EMBEDDING_DIMENSIONS') ?? 1536;
  }

  async gerar(texto: string): Promise<number[]> {
    const [vetor] = await this.gerarEmLote([texto]);

    if (!vetor) throw new Error('A API não devolveu o embedding');

    return vetor;
  }

  /**
   * Gera embeddings em lote.
   *
   * A ordem da resposta acompanha a da entrada, então o índice do vetor
   * corresponde ao do texto — é o que permite associar cada trecho ao seu
   * embedding sem outro identificador.
   */
  async gerarEmLote(textos: string[]): Promise<number[][]> {
    if (textos.length === 0) return [];

    const vetores: number[][] = [];

    for (let i = 0; i < textos.length; i += MAX_POR_LOTE) {
      const lote = textos.slice(i, i + MAX_POR_LOTE);

      const resposta = await this.openai.embeddings.create({
        model: this.modelo,
        input: lote,
        dimensions: this.dimensoes,
      });

      vetores.push(...resposta.data.map((d) => d.embedding));
    }

    this.logger.debug(`${vetores.length} embedding(s) gerado(s)`);

    return vetores;
  }
}
