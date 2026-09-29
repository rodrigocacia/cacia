import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { LeadImportStatus, LeadSource, Prisma } from '@cacia/database';
import type { CampoImportavel } from '@cacia/contracts';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { aparar, decodificar, lerCsv } from '@/modules/lead-imports/csv';
import { mapearLinha } from '@/modules/lead-imports/lead-imports.service';
import { projetarStatus } from '@/modules/leads/projecao-de-status';
import { FILA, type JobImportacaoLeads } from '../filas/filas';

/** Quantos erros de linha o relatório guarda. */
const MAXIMO_DE_ERROS = 50;

/** De quantas em quantas linhas o progresso é gravado. */
const INTERVALO_DE_PROGRESSO = 100;

interface ErroDeLinha {
  linha: number;
  motivo: string;
}

/**
 * Transforma a planilha confirmada em leads.
 *
 * Fora da requisição: cinco mil linhas não cabem no tempo de resposta de quem
 * clicou em confirmar, e um `timeout` no meio deixaria a base com metade da
 * planilha sem ninguém saber qual metade.
 *
 * Nunca deixa a falha subir para o BullMQ. A fila foi criada com uma única
 * tentativa de propósito — repetir recomeçaria do zero sobre uma base que já
 * recebeu parte das linhas, criando o dobro do que a planilha tinha. O que
 * acontece em vez disso é a importação terminar em FAILED, com o motivo
 * gravado e o que já entrou preservado.
 */
@Processor(FILA.IMPORTACAO_LEADS)
export class ImportacaoLeadsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportacaoLeadsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<JobImportacaoLeads>): Promise<{ importados: number }> {
    const { officeId, importId } = job.data;

    const importacao = await this.prisma.leadImport.findFirst({
      where: { id: importId, officeId },
      select: {
        id: true,
        status: true,
        fileKey: true,
        mapping: true,
        pipelineId: true,
        stageId: true,
        tagIds: true,
      },
    });

    if (!importacao) {
      this.logger.warn(`Importação ${importId} não existe mais`);
      return { importados: 0 };
    }

    // Só sai de QUEUED. Um job repetido sobre uma importação que já rodou
    // criaria a planilha inteira uma segunda vez.
    if (importacao.status !== LeadImportStatus.QUEUED) {
      this.logger.warn(
        `Importação ${importId} não está na fila (${importacao.status}) — ignorada`,
      );
      return { importados: 0 };
    }

    await this.prisma.leadImport.update({
      where: { id: importId },
      data: { status: LeadImportStatus.RUNNING, startedAt: new Date() },
    });

    try {
      const resultado = await this.importar(officeId, importacao);

      await this.prisma.leadImport.update({
        where: { id: importId },
        data: {
          status: LeadImportStatus.DONE,
          importedRows: resultado.importados,
          skippedRows: resultado.ignorados,
          failedRows: resultado.falhas,
          errors: resultado.erros as unknown as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      });

      await this.storage
        .remover(importacao.fileKey)
        .catch(() => this.logger.warn(`Arquivo ${importacao.fileKey} ficou`));

      this.logger.log(
        `Importação ${importId}: ${resultado.importados} criado(s), ` +
          `${resultado.ignorados} já existia(m), ${resultado.falhas} com erro`,
      );

      return { importados: resultado.importados };
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : 'erro desconhecido';

      await this.prisma.leadImport.update({
        where: { id: importId },
        data: {
          status: LeadImportStatus.FAILED,
          errorMessage: motivo,
          finishedAt: new Date(),
        },
      });

      this.logger.error(`Importação ${importId} falhou: ${motivo}`);

      return { importados: 0 };
    }
  }

  private async importar(
    officeId: string,
    importacao: {
      id: string;
      fileKey: string;
      mapping: Prisma.JsonValue;
      pipelineId: string | null;
      stageId: string | null;
      tagIds: string[];
    },
  ): Promise<{
    importados: number;
    ignorados: number;
    falhas: number;
    erros: ErroDeLinha[];
  }> {
    if (!importacao.stageId || !importacao.pipelineId) {
      throw new Error('Importação confirmada sem etapa de destino');
    }

    const mapping = importacao.mapping as Record<string, CampoImportavel>;

    const conteudo = await this.storage.baixar(importacao.fileKey);
    const linhas = lerCsv(decodificar(conteudo));

    // Primeira linha é o cabeçalho; os dados começam depois dela.
    const dados = linhas.slice(1);

    const etapa = await this.prisma.pipelineStage.findFirstOrThrow({
      where: { id: importacao.stageId, officeId },
      select: { position: true, kind: true },
    });

    const status = projetarStatus(etapa);

    // Os telefones que já existem, de uma vez. A alternativa seria descobrir
    // duplicata pelo erro do banco, uma exceção por linha repetida — e uma
    // planilha reenviada é justamente o caso em que TODAS repetem.
    const existentes = new Set(
      (
        await this.prisma.lead.findMany({
          where: { officeId },
          select: { remotejid: true },
        })
      ).map((lead) => lead.remotejid),
    );

    let importados = 0;
    let ignorados = 0;
    let falhas = 0;
    const erros: ErroDeLinha[] = [];

    const registrarErro = (linha: number, motivo: string): void => {
      falhas += 1;
      if (erros.length < MAXIMO_DE_ERROS) erros.push({ linha, motivo });
    };

    for (let i = 0; i < dados.length; i += 1) {
      // +2: a linha 1 é o cabeçalho e a contagem que a pessoa vê começa em 1
      const numeroDaLinha = i + 2;
      const linha = dados[i];

      if (!linha) continue;

      const { dados: valores, erro } = mapearLinha(aparar(linha), mapping);

      if (erro) {
        registrarErro(numeroDaLinha, erro);
        continue;
      }

      const remotejid = valores.remotejid as string;

      // Repetido dentro da própria planilha também conta como já existente:
      // o Set recebe cada telefone criado.
      if (existentes.has(remotejid)) {
        ignorados += 1;
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          const lead = await tx.lead.create({
            data: {
              officeId,
              name: valores.name ?? remotejid,
              remotejid,
              email: valores.email,
              briefing: valores.briefing,
              value: valores.value,
              source: LeadSource.IMPORT,
              sourceDetail: valores.sourceDetail,
              pipelineId: importacao.pipelineId,
              stageId: importacao.stageId,
              stageChangedAt: new Date(),
              status,
              importId: importacao.id,
              lastActivityAt: new Date(),
              ...(importacao.tagIds.length && {
                tags: {
                  create: importacao.tagIds.map((tagId) => ({
                    officeId,
                    tagId,
                  })),
                },
              }),
            },
            select: { id: true },
          });

          await tx.leadStageHistory.create({
            data: {
              officeId,
              leadId: lead.id,
              toStageId: importacao.stageId as string,
              userId: null,
            },
          });
        });

        existentes.add(remotejid);
        importados += 1;
      } catch (erroDaLinha) {
        registrarErro(
          numeroDaLinha,
          erroDaLinha instanceof Prisma.PrismaClientKnownRequestError &&
            erroDaLinha.code === 'P2002'
            ? 'Já existe um lead com este telefone'
            : 'Não foi possível gravar esta linha',
        );
      }

      if ((i + 1) % INTERVALO_DE_PROGRESSO === 0) {
        // Progresso parcial: uma planilha grande leva minutos, e uma tela que
        // fica em zero até o fim parece travada.
        await this.prisma.leadImport.update({
          where: { id: importacao.id },
          data: {
            importedRows: importados,
            skippedRows: ignorados,
            failedRows: falhas,
          },
        });
      }
    }

    return { importados, ignorados, falhas, erros };
  }
}
