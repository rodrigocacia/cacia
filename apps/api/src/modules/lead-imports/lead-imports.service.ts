import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { LeadImportStatus, Prisma } from '@cacia/database';
import { CAMPOS_IMPORTAVEIS, type CampoImportavel } from '@cacia/contracts';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { FILA, type JobImportacaoLeads } from '@/worker/filas/filas';
import { PipelinesService } from '../pipelines/pipelines.service';
import { TagsService } from '../tags/tags.service';
import { normalizarRemotejid, remotejidValido } from '../leads/remotejid';
import { aparar, decodificar, detectarSeparador, lerCsv } from './csv';
import { sugerirMapeamento } from './sugerir-mapeamento';
import type {
  ConfirmarImportacaoDto,
  ListarImportacoesDto,
} from './dto/lead-import.dto';

export interface ArquivoRecebido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Teto do arquivo. Acima disso a prévia deixa de caber no tempo da requisição. */
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

/** Linhas mostradas na prévia. O bastante para reconhecer as colunas. */
const LINHAS_DE_AMOSTRA = 10;

const CAMPOS = {
  id: true,
  fileName: true,
  status: true,
  pipelineId: true,
  stageId: true,
  tagIds: true,
  mapping: true,
  totalRows: true,
  importedRows: true,
  skippedRows: true,
  failedRows: true,
  errors: true,
  errorMessage: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
} as const;

@Injectable()
export class LeadImportsService {
  private readonly logger = new Logger(LeadImportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly pipelines: PipelinesService,
    private readonly tags: TagsService,
    @InjectQueue(FILA.IMPORTACAO_LEADS)
    private readonly fila: Queue<JobImportacaoLeads>,
  ) {}

  /**
   * Recebe o arquivo e devolve a prévia.
   *
   * Nada é gravado como lead aqui. O que sai é o que o servidor entendeu do
   * arquivo — colunas, amostra e o palpite de mapeamento — para que a pessoa
   * confirme antes de qualquer escrita. Importação sem essa etapa é como uma
   * base ganha mil linhas com o telefone na coluna do nome.
   */
  async prever(
    officeId: string,
    userId: string,
    arquivo: ArquivoRecebido | undefined,
  ) {
    if (!arquivo) throw new BadRequestException('Envie um arquivo CSV');

    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      throw new BadRequestException(
        `Arquivo maior que ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB`,
      );
    }

    const texto = decodificar(arquivo.buffer);
    const separador = detectarSeparador(texto);
    const amostra = lerCsv(texto, {
      separador,
      limite: LINHAS_DE_AMOSTRA + 1,
    });

    const cabecalhos = amostra[0] ? aparar(amostra[0]) : [];

    if (cabecalhos.length === 0) {
      throw new BadRequestException(
        'O arquivo está vazio ou não tem uma linha de cabeçalho',
      );
    }

    // Conta as linhas do arquivo inteiro; a amostra só olhou as primeiras.
    const totalRows = Math.max(0, lerCsv(texto, { separador }).length - 1);

    if (totalRows === 0) {
      throw new BadRequestException(
        'O arquivo tem cabeçalho mas nenhuma linha de dados',
      );
    }

    const enviado = await this.storage.enviar({
      officeId,
      conteudo: arquivo.buffer,
      nomeOriginal: arquivo.originalname,
      mimetype: arquivo.mimetype || 'text/csv',
    });

    const mapping = sugerirMapeamento(cabecalhos);

    const importacao = await this.prisma.leadImport.create({
      data: {
        officeId,
        userId,
        fileKey: enviado.chave,
        fileName: arquivo.originalname,
        status: LeadImportStatus.PREVIEW,
        totalRows,
        mapping,
      },
      select: CAMPOS,
    });

    return {
      ...importacao,
      separador,
      columns: cabecalhos.map((header, index) => ({
        index,
        header,
        amostra: amostra
          .slice(1)
          .map((linha) => linha[index] ?? '')
          .filter((valor) => valor !== ''),
      })),
    };
  }

  /**
   * Aceita o mapeamento e enfileira a escrita.
   *
   * A escrita sai da requisição: cinco mil linhas não cabem no tempo de
   * resposta de quem clicou em confirmar, e um `timeout` no meio deixaria a
   * base com metade da planilha e ninguém sabendo qual metade.
   */
  async confirmar(officeId: string, id: string, dto: ConfirmarImportacaoDto) {
    const importacao = await this.garantirQueExiste(officeId, id);

    if (importacao.status !== LeadImportStatus.PREVIEW) {
      throw new ConflictException(
        'Esta importação já foi confirmada ou encerrada',
      );
    }

    const mapping = this.validarMapeamento(dto.mapping);

    const etapa = dto.stageId
      ? await this.garantirEtapa(officeId, dto.stageId)
      : await this.pipelines.etapaInicial(officeId);

    const tagIds = await this.tags.validar(officeId, dto.tagIds ?? []);

    const atualizada = await this.prisma.leadImport.update({
      where: { id },
      data: {
        status: LeadImportStatus.QUEUED,
        mapping,
        pipelineId: etapa.pipelineId,
        stageId: etapa.stageId,
        tagIds,
      },
      select: CAMPOS,
    });

    await this.fila.add(
      'importar',
      { officeId, importId: id },
      {
        // Sem repetição automática: a segunda tentativa recomeçaria do zero
        // sobre uma base que já recebeu parte das linhas. Falhou, a pessoa vê
        // o motivo no relatório e reenvia o que faltou.
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: { count: 100 },
      },
    );

    return atualizada;
  }

  async listar(officeId: string, dto: ListarImportacoesDto) {
    const where = {
      officeId,
      ...(dto.status && { status: dto.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.leadImport.findMany({
        where,
        select: {
          ...CAMPOS,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.leadImport.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const importacao = await this.prisma.leadImport.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria o
      // registro de outro escritório
      where: { id, officeId },
      select: {
        ...CAMPOS,
        user: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, color: true } },
        pipeline: { select: { id: true, name: true } },
      },
    });

    if (!importacao) throw new NotFoundException('Importação não encontrada');

    return importacao;
  }

  /**
   * Cancela uma importação que ainda não começou a escrever.
   *
   * Depois de `RUNNING` não há cancelamento: parar no meio deixaria metade
   * dos leads criados, e desfazê-los seria apagar registros que já podem ter
   * conversa.
   */
  async cancelar(officeId: string, id: string) {
    const importacao = await this.garantirQueExiste(officeId, id);

    if (
      importacao.status !== LeadImportStatus.PREVIEW &&
      importacao.status !== LeadImportStatus.QUEUED
    ) {
      throw new ConflictException(
        'Esta importação já está em andamento ou encerrada',
      );
    }

    await this.storage.remover(importacao.fileKey).catch((erro: unknown) => {
      // O arquivo é temporário; falhar em removê-lo não pode impedir o
      // cancelamento do que o usuário pediu.
      this.logger.warn(
        `Não foi possível remover o arquivo da importação ${id}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    });

    return this.prisma.leadImport.update({
      where: { id },
      data: { status: LeadImportStatus.CANCELED, finishedAt: new Date() },
      select: CAMPOS,
    });
  }

  // -------------------------------------------------------------- apoio

  /**
   * Confere o mapeamento vindo da tela.
   *
   * Três recusas, todas por um motivo concreto: campo inventado gravaria numa
   * coluna que não existe; coluna repetida faria uma sobrescrever a outra em
   * silêncio; e sem telefone não há como falar com a pessoa nem como saber se
   * ela já está na base — que é a chave da deduplicação.
   */
  private validarMapeamento(
    mapping: Record<string, string>,
  ): Record<string, CampoImportavel> {
    const validado: Record<string, CampoImportavel> = {};
    const usados = new Set<string>();

    for (const [indice, campo] of Object.entries(mapping)) {
      if (!/^\d+$/.test(indice)) {
        throw new BadRequestException(`Índice de coluna inválido: "${indice}"`);
      }

      if (!CAMPOS_IMPORTAVEIS.includes(campo as CampoImportavel)) {
        throw new BadRequestException(`Campo desconhecido: "${campo}"`);
      }

      if (usados.has(campo)) {
        throw new BadRequestException(
          `Duas colunas foram mapeadas para "${campo}"`,
        );
      }

      usados.add(campo);
      validado[indice] = campo as CampoImportavel;
    }

    if (!usados.has('remotejid')) {
      throw new BadRequestException(
        'Indique qual coluna tem o telefone — sem ele não é possível importar',
      );
    }

    return validado;
  }

  private async garantirQueExiste(officeId: string, id: string) {
    const importacao = await this.prisma.leadImport.findFirst({
      where: { id, officeId },
      select: { id: true, status: true, fileKey: true },
    });

    if (!importacao) throw new NotFoundException('Importação não encontrada');

    return importacao;
  }

  private async garantirEtapa(officeId: string, stageId: string) {
    const etapa = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, officeId, deletedAt: null },
      select: { id: true, pipelineId: true, position: true, kind: true },
    });

    if (!etapa) throw new NotFoundException('Etapa não encontrada');

    return { ...etapa, stageId: etapa.id };
  }
}

/** Só para o processador — a linha crua vira dados de lead. */
export interface LinhaMapeada {
  name?: string;
  remotejid?: string;
  email?: string;
  briefing?: string;
  value?: Prisma.Decimal | number;
  sourceDetail?: string;
}

/**
 * Aplica o mapeamento a uma linha e devolve o que dá para gravar.
 *
 * Fora da classe porque o processador do worker usa a mesma regra, e duas
 * cópias dela é como a prévia e a importação passam a discordar sobre o que a
 * planilha diz.
 */
export function mapearLinha(
  linha: string[],
  mapping: Record<string, CampoImportavel>,
): { dados: LinhaMapeada; erro?: string } {
  const dados: LinhaMapeada = {};

  for (const [indice, campo] of Object.entries(mapping)) {
    const bruto = (linha[Number(indice)] ?? '').trim();

    if (bruto === '') continue;

    if (campo === 'value') {
      // "1.234,56" é como o Excel brasileiro escreve — ponto de milhar e
      // vírgula decimal. Lido como número em inglês viraria 1.23456.
      const numero = Number(
        bruto
          .replace(/[^\d,.-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.'),
      );

      if (Number.isFinite(numero) && numero >= 0) dados.value = numero;

      continue;
    }

    // O `value` ja saiu acima; o que resta e texto, e o TypeScript nao deduz
    // isso sozinho a partir do `continue`.
    dados[campo as Exclude<CampoImportavel, 'value'>] = bruto;
  }

  if (!dados.remotejid) return { dados, erro: 'Telefone em branco' };

  // Valida o valor CRU e só depois normaliza — ver LeadsService.criar: na
  // ordem inversa a checagem nunca reprova nada.
  if (!remotejidValido(dados.remotejid)) {
    return { dados, erro: `Telefone inválido: ${dados.remotejid}` };
  }

  dados.remotejid = normalizarRemotejid(dados.remotejid);

  // Nome em branco não impede a importação: o telefone identifica o contato, e
  // recusar a linha inteira por falta de nome descartaria um lead real.
  if (!dados.name) dados.name = dados.remotejid.split('@')[0];

  return { dados };
}
