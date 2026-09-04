import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

/** Tipo do ponto, para que documento e memória convivam na mesma coleção. */
export type TipoVetor = 'document' | 'memory_fact';

export interface PayloadVetor {
  /** Fronteira de isolamento — obrigatório em toda busca. */
  officeId: string;
  kind: TipoVetor;
  content: string;
  documentId?: string;
  customerId?: string;
  leadId?: string;
  chatId?: string;
  markId?: string;
  chunkIndex?: number;
  createdAt: string;
}

export interface ResultadoBusca {
  id: string;
  score: number;
  payload: PayloadVetor;
}

export interface FiltroBusca {
  /** Obrigatório: sem ele a busca alcançaria dados de outro escritório. */
  officeId: string;
  kind?: TipoVetor;
  documentId?: string;
  customerId?: string;
  leadId?: string;
  chatId?: string;
}

/**
 * Busca vetorial no Qdrant.
 *
 * Uma coleção única com partição por payload — prática recomendada do Qdrant
 * para multi-tenant. O sistema anterior usava um namespace do Pinecone POR
 * DOCUMENTO, o que impedia buscar entre documentos: a IA só conseguia ler um
 * arquivo por vez, e o usuário precisava dizer qual.
 */
@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly cliente: QdrantClient;
  private readonly colecao: string;
  private readonly dimensoes: number;

  constructor(config: ConfigService) {
    this.colecao = config.get<string>('QDRANT_COLLECTION') ?? 'cacia_vectors';
    this.dimensoes = config.get<number>('OPENAI_EMBEDDING_DIMENSIONS') ?? 1536;

    this.cliente = new QdrantClient({
      url: config.getOrThrow<string>('QDRANT_URL'),
      apiKey: config.get<string>('QDRANT_API_KEY'),
      checkCompatibility: false,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.garantirColecao();
    } catch (erro) {
      // Não impede a API de subir: sem o Qdrant, o RAG e a memória fria ficam
      // indisponíveis, mas o atendimento continua funcionando.
      this.logger.error(
        `Qdrant indisponível na inicialização: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  /**
   * Cria a coleção e os índices de payload.
   *
   * Os índices são o que torna o filtro barato. Sem índice em officeId, cada
   * busca varreria os vetores de todos os escritórios antes de filtrar.
   */
  private async garantirColecao(): Promise<void> {
    const { collections } = await this.cliente.getCollections();

    if (collections.some((c) => c.name === this.colecao)) return;

    await this.cliente.createCollection(this.colecao, {
      vectors: { size: this.dimensoes, distance: 'Cosine' },
    });

    for (const campo of [
      'officeId',
      'kind',
      'documentId',
      'customerId',
      'leadId',
      'chatId',
    ]) {
      await this.cliente.createPayloadIndex(this.colecao, {
        field_name: campo,
        field_schema: 'keyword',
      });
    }

    this.logger.log(`Coleção ${this.colecao} criada com índices de payload`);
  }

  async inserir(
    pontos: { id: string; vetor: number[]; payload: PayloadVetor }[],
  ): Promise<void> {
    if (pontos.length === 0) return;

    await this.cliente.upsert(this.colecao, {
      wait: true,
      points: pontos.map((p) => ({
        id: p.id,
        vector: p.vetor,
        payload: p.payload as unknown as Record<string, unknown>,
      })),
    });
  }

  /**
   * Busca por similaridade.
   *
   * O officeId é parte obrigatória da assinatura, não um filtro opcional:
   * esquecê-lo devolveria trechos de documentos de outro escritório.
   */
  async buscar(
    vetor: number[],
    filtro: FiltroBusca,
    limite = 5,
  ): Promise<ResultadoBusca[]> {
    const must = Object.entries(filtro)
      .filter(([, valor]) => valor !== undefined)
      .map(([campo, valor]) => ({ key: campo, match: { value: valor } }));

    const { points } = await this.cliente.query(this.colecao, {
      query: vetor,
      filter: { must },
      limit: limite,
      with_payload: true,
    });

    return points.map((p) => ({
      id: String(p.id),
      score: p.score,
      payload: p.payload as unknown as PayloadVetor,
    }));
  }

  /** Remove os pontos de um documento — usado quando ele é excluído. */
  async removerPorDocumento(
    officeId: string,
    documentId: string,
  ): Promise<void> {
    await this.cliente.delete(this.colecao, {
      wait: true,
      filter: {
        must: [
          { key: 'officeId', match: { value: officeId } },
          { key: 'documentId', match: { value: documentId } },
        ],
      },
    });
  }

  async remover(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.cliente.delete(this.colecao, { wait: true, points: ids });
  }

  async estaSaudavel(): Promise<boolean> {
    try {
      await this.cliente.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}
