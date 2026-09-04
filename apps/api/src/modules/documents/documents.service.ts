import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { DocumentType, DocumentVectorStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { RagService } from '@/ai/rag/rag.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { FILA, type JobIndexacaoDocumento } from '@/worker/filas/filas';
import { fragmentar } from './fragmentacao';
import { extrairTexto } from './extracao-de-texto';
import type {
  AtualizarDocumentoDto,
  ListarDocumentosDto,
} from './dto/document.dto';

const CAMPOS = {
  id: true,
  title: true,
  type: true,
  category: true,
  status: true,
  extension: true,
  sizeBytes: true,
  contentUrl: true,
  vectorStatus: true,
  vectorChunksCount: true,
  folderId: true,
  customerId: true,
  processId: true,
  createdAt: true,
} as const;

/** Teto de upload. Acima disso, o processamento fica caro demais por arquivo. */
const TAMANHO_MAXIMO = 20 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly rag: RagService,
    @InjectQueue(FILA.INDEXACAO_DOCUMENTO)
    private readonly indexacao: Queue<JobIndexacaoDocumento>,
  ) {}

  async listar(officeId: string, dto: ListarDocumentosDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(dto.processId && { processId: dto.processId }),
      ...(dto.folderId && { folderId: dto.folderId }),
      ...(dto.search && {
        title: { contains: dto.search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        select: CAMPOS,
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.document.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const documento = await this.prisma.document.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        vectorErrorMessage: true,
        customer: { select: { id: true, name: true } },
        process: { select: { id: true, number: true } },
      },
    });

    if (!documento) throw new NotFoundException('Documento não encontrado');

    return documento;
  }

  /**
   * Link temporário para baixar.
   *
   * O arquivo é privado no storage; este é o único caminho de acesso, e ele
   * confirma antes que a chave pertence ao escritório da requisição.
   */
  async gerarLinkDeDownload(officeId: string, id: string): Promise<string> {
    const documento = await this.prisma.document.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { contentUrl: true },
    });

    if (!documento?.contentUrl) {
      throw new NotFoundException('Documento sem arquivo associado');
    }

    if (!this.storage.pertenceAoEscritorio(documento.contentUrl, officeId)) {
      // Não deveria acontecer, mas se acontecer é vazamento entre escritórios
      this.logger.error(
        `Documento ${id} do escritório ${officeId} aponta para chave de outro escritório`,
      );
      throw new NotFoundException('Documento não encontrado');
    }

    return this.storage.gerarLinkTemporario(documento.contentUrl);
  }

  /**
   * Recebe o arquivo, guarda e registra.
   *
   * A indexação para busca semântica NÃO acontece aqui: extrair texto e gerar
   * embeddings leva segundos, e a requisição de upload não pode esperar por
   * isso. O documento nasce com vectorStatus PENDING e o worker cuida.
   */
  async enviar(params: {
    officeId: string;
    arquivo: { buffer: Buffer; originalname: string; mimetype: string };
    title?: string;
    customerId?: string;
    processId?: string;
    folderId?: string;
  }) {
    if (params.arquivo.buffer.byteLength > TAMANHO_MAXIMO) {
      throw new BadRequestException('Arquivo acima de 20 MB');
    }

    const enviado = await this.storage.enviar({
      officeId: params.officeId,
      conteudo: params.arquivo.buffer,
      nomeOriginal: params.arquivo.originalname,
      mimetype: params.arquivo.mimetype,
    });

    const documento = await this.prisma.document.create({
      data: {
        officeId: params.officeId,
        customerId: params.customerId,
        processId: params.processId,
        folderId: params.folderId,
        type: DocumentType.UPLOAD,
        title: params.title ?? params.arquivo.originalname,
        extension: params.arquivo.originalname.split('.').pop(),
        contentUrl: enviado.chave,
        sizeBytes: enviado.tamanhoBytes,
        vectorStatus: DocumentVectorStatus.PENDING,
      },
      select: CAMPOS,
    });

    await this.pedirIndexacao(params.officeId, documento.id);

    return documento;
  }

  /**
   * Enfileira a leitura do documento.
   *
   * A falha não desfaz o upload: o arquivo está salvo e o documento fica em
   * PENDING, que é exatamente o estado que a varredura do worker procura. O
   * pior caso é a busca semântica alcançá-lo alguns minutos depois.
   */
  private async pedirIndexacao(
    officeId: string,
    documentId: string,
  ): Promise<void> {
    try {
      await this.indexacao.add(
        'indexar',
        { officeId, documentId },
        {
          // O id do documento como jobId torna o enfileiramento idempotente:
          // a varredura pode repetir o pedido sem criar um segundo job.
          jobId: `documento-${documentId}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: true,
          removeOnFail: { count: 200 },
        },
      );
    } catch (erro) {
      this.logger.warn(
        `Não foi possível enfileirar a indexação do documento ${documentId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  /**
   * Documentos esperando indexação, de todos os escritórios.
   *
   * Sem escopo de tenant de propósito: quem chama é a varredura do worker, que
   * não roda no contexto de uma requisição. O `officeId` de cada um viaja no
   * job e volta a limitar tudo dali em diante.
   */
  listarPendentesDeIndexacao(limite = 50) {
    return this.prisma.document.findMany({
      where: {
        deletedAt: null,
        vectorStatus: DocumentVectorStatus.PENDING,
        contentUrl: { not: null },
      },
      select: { id: true, officeId: true },
      orderBy: { createdAt: 'asc' },
      take: limite,
    });
  }

  /**
   * Atualiza os metadados do documento.
   *
   * Quando o conteúdo em texto muda, a indexação volta para PENDING: o que
   * está no índice vetorial passou a não corresponder ao documento, e deixá-lo
   * como está faria a IA citar um trecho que não existe mais.
   */
  async atualizar(officeId: string, id: string, dto: AtualizarDocumentoDto) {
    const atual = await this.prisma.document.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true, content: true },
    });

    if (!atual) throw new NotFoundException('Documento não encontrado');

    const conteudoMudou =
      dto.content !== undefined && dto.content !== atual.content;

    if (conteudoMudou) {
      await this.rag.removerDocumento(officeId, id).catch((erro: Error) => {
        this.logger.warn(
          `Falha ao limpar vetores do documento ${id}: ${erro.message}`,
        );
      });
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        ...dto,
        ...(conteudoMudou && {
          vectorStatus: DocumentVectorStatus.PENDING,
          vectorChunksCount: 0,
          vectorErrorMessage: null,
        }),
      },
      select: CAMPOS,
    });
  }

  /**
   * Indexa o documento para busca semântica. Chamado pelo worker.
   *
   * Marca PROCESSING antes de começar e grava a mensagem de erro em caso de
   * falha — sem isso, documento que falhou fica indistinguível de documento
   * que nunca foi processado, que era o caso no sistema anterior.
   */
  async indexar(officeId: string, id: string): Promise<number> {
    const documento = await this.prisma.document.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        id: true,
        contentUrl: true,
        extension: true,
        customerId: true,
      },
    });

    if (!documento?.contentUrl) {
      throw new NotFoundException('Documento sem arquivo associado');
    }

    await this.prisma.document.update({
      where: { id },
      data: { vectorStatus: DocumentVectorStatus.PROCESSING },
    });

    try {
      const conteudo = await this.storage.baixar(documento.contentUrl);
      const texto = await extrairTexto(conteudo, documento.extension);

      if (texto.trim().length === 0) {
        // Imagem escaneada sem OCR, por exemplo. Não é erro — é um documento
        // do qual não há texto a extrair.
        await this.prisma.document.update({
          where: { id },
          data: {
            vectorStatus: DocumentVectorStatus.SKIPPED,
            vectorProcessedAt: new Date(),
          },
        });
        return 0;
      }

      const trechos = fragmentar(texto);

      await this.rag.indexar({
        officeId,
        documentId: id,
        customerId: documento.customerId ?? undefined,
        trechos,
      });

      await this.prisma.document.update({
        where: { id },
        data: {
          vectorStatus: DocumentVectorStatus.COMPLETED,
          vectorChunksCount: trechos.length,
          vectorProcessedAt: new Date(),
          vectorErrorMessage: null,
        },
      });

      return trechos.length;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'erro';

      await this.prisma.document.update({
        where: { id },
        data: {
          vectorStatus: DocumentVectorStatus.FAILED,
          vectorErrorMessage: mensagem.slice(0, 500),
          vectorProcessedAt: new Date(),
        },
      });

      this.logger.error(`Falha ao indexar o documento ${id}: ${mensagem}`);
      throw erro;
    }
  }

  /**
   * Exclusão lógica no banco, remoção definitiva no índice vetorial.
   *
   * O arquivo permanece no storage: excluir documento é operação reversível
   * pelo suporte, e apagar o arquivo tornaria a reversão impossível.
   */
  async remover(officeId: string, id: string): Promise<void> {
    const documento = await this.prisma.document.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!documento) throw new NotFoundException('Documento não encontrado');

    await this.rag.removerDocumento(officeId, id).catch((erro: Error) => {
      this.logger.warn(
        `Falha ao remover vetores do documento ${id}: ${erro.message}`,
      );
    });

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Documentos cuja indexação falhou — para que a falha seja visível. */
  listarComFalhaDeIndexacao(officeId: string) {
    return this.prisma.document.findMany({
      where: {
        officeId,
        deletedAt: null,
        vectorStatus: DocumentVectorStatus.FAILED,
      },
      select: {
        id: true,
        title: true,
        vectorErrorMessage: true,
        vectorProcessedAt: true,
      },
      orderBy: { vectorProcessedAt: 'desc' },
      take: 100,
    });
  }
}
