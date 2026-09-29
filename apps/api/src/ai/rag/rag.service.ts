import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from '@/integrations/qdrant/qdrant.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EmbeddingsService } from '../embeddings.service';

export interface TrechoEncontrado {
  documento: string;
  conteudo: string;
  relevancia: number;
}

/** Abaixo disso o trecho é ruído: melhor não devolver nada. */
const RELEVANCIA_MINIMA = 0.3;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly qdrant: QdrantService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  /**
   * Busca nos documentos.
   *
   * Diferente do sistema anterior, `documentId` é OPCIONAL. Lá, cada documento
   * vivia em seu próprio namespace do Pinecone e a busca exigia saber qual
   * arquivo consultar — o que impedia perguntar "o que consta nos autos deste
   * cliente?" e obrigava o usuário a escolher o arquivo antes de perguntar.
   */
  async buscar(params: {
    officeId: string;
    pergunta: string;
    customerId?: string;
    documentId?: string;
    limite?: number;
  }): Promise<TrechoEncontrado[]> {
    const vetor = await this.embeddings.gerar(params.pergunta, {
      officeId: params.officeId,
    });

    const resultados = await this.qdrant.buscar(
      vetor,
      {
        officeId: params.officeId,
        kind: 'document',
        customerId: params.customerId,
        documentId: params.documentId,
      },
      params.limite ?? 5,
    );

    const relevantes = resultados.filter((r) => r.score >= RELEVANCIA_MINIMA);

    if (relevantes.length === 0) return [];

    const titulos = await this.titulosDe(
      params.officeId,
      relevantes.map((r) => r.payload.documentId).filter(Boolean) as string[],
    );

    return relevantes.map((r) => ({
      documento: titulos.get(r.payload.documentId ?? '') ?? 'documento',
      conteudo: r.payload.content,
      relevancia: r.score,
    }));
  }

  /**
   * Indexa os trechos de um documento.
   *
   * O `customerId` vai no payload para que a busca por cliente funcione sem
   * consultar o banco a cada resultado.
   */
  async indexar(params: {
    officeId: string;
    documentId: string;
    customerId?: string;
    trechos: string[];
  }): Promise<number> {
    if (params.trechos.length === 0) return 0;

    const vetores = await this.embeddings.gerarEmLote(params.trechos, {
      officeId: params.officeId,
    });

    await this.qdrant.inserir(
      params.trechos.map((trecho, i) => ({
        // Determinístico: reindexar o mesmo documento substitui os pontos em
        // vez de duplicá-los.
        id: `${params.documentId}-${i}`,
        vetor: vetores[i] ?? [],
        payload: {
          officeId: params.officeId,
          kind: 'document' as const,
          content: trecho,
          documentId: params.documentId,
          customerId: params.customerId,
          chunkIndex: i,
          createdAt: new Date().toISOString(),
        },
      })),
    );

    this.logger.log(
      `${params.trechos.length} trecho(s) indexado(s) do documento ${params.documentId}`,
    );

    return params.trechos.length;
  }

  async removerDocumento(officeId: string, documentId: string): Promise<void> {
    await this.qdrant.removerPorDocumento(officeId, documentId);
  }

  private async titulosDe(
    officeId: string,
    documentIds: string[],
  ): Promise<Map<string, string>> {
    if (documentIds.length === 0) return new Map();

    const documentos = await this.prisma.document.findMany({
      where: { officeId, id: { in: documentIds } },
      select: { id: true, title: true },
    });

    return new Map(documentos.map((d) => [d.id, d.title]));
  }
}
