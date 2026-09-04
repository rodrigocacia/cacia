import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  ProcessUpdateStatus,
  type Prisma,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';

export interface AndamentoJudit {
  step_id: string;
  step_date?: string;
  content?: string;
}

export interface EventoJudit {
  request_id?: string;
  tracking_id?: string;
  response_data?: {
    code?: string;
    name?: string;
    instance?: number;
    status?: string;
    phase?: string;
    area?: string;
    justice?: string;
    tribunal?: string;
    tribunal_acronym?: string;
    county?: string;
    state?: string;
    city?: string;
    judge?: string;
    distribution_date?: string;
    amount?: number;
    currency?: string;
    free_justice?: boolean;
    secrecy_level?: number;
    courts?: unknown;
    classifications?: unknown;
    subjects?: unknown;
    partie?: unknown;
    steps?: AndamentoJudit[];
    last_step?: AndamentoJudit;
  };
}

/**
 * Recebe as atualizações da Judit.
 *
 * Chega por dois caminhos: a consulta pontual do cadastro (`request_id`) e o
 * monitoramento contínuo (`tracking_id`). O segundo é a novidade — antes só
 * existia o primeiro, e movimentações posteriores nunca chegavam.
 */
@Injectable()
export class JuditWebhookService {
  private readonly logger = new Logger(JuditWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processar(evento: EventoJudit): Promise<void> {
    try {
      const processo = await this.localizarProcesso(evento);

      if (!processo) {
        this.logger.warn(
          `Evento da Judit sem processo correspondente: ${
            evento.tracking_id ?? evento.request_id ?? 'sem identificador'
          }`,
        );
        return;
      }

      const dados = evento.response_data;
      if (!dados) return;

      await this.atualizarProcesso(processo.id, processo.officeId, dados);
      await this.registrarAndamentos(
        processo.id,
        processo.officeId,
        dados.steps ?? [],
      );
    } catch (erro) {
      // Não propaga: a Judit reenviaria e duplicaria os andamentos.
      this.logger.error(
        `Falha ao processar evento da Judit: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  private localizarProcesso(evento: EventoJudit) {
    // O tracking_id tem prioridade: é o vínculo permanente. O request_id
    // pertence a uma consulta específica e pode se repetir entre processos
    // se a Judit reaproveitar identificadores.
    const where = evento.tracking_id
      ? { juditTrackingId: evento.tracking_id }
      : { requestId: evento.request_id };

    return this.prisma.process.findFirst({
      where: { ...where, deletedAt: null },
      select: { id: true, officeId: true, number: true, customerId: true },
    });
  }

  private async atualizarProcesso(
    processId: string,
    officeId: string,
    dados: NonNullable<EventoJudit['response_data']>,
  ): Promise<void> {
    await this.prisma.process.updateMany({
      where: { id: processId, officeId },
      data: {
        name: dados.name,
        instance: dados.instance,
        phase: dados.phase,
        area: dados.area,
        justice: dados.justice,
        tribunal: dados.tribunal,
        tribunalAcronym: dados.tribunal_acronym,
        county: dados.county,
        state: dados.state,
        city: dados.city,
        judge: dados.judge,
        distributionDate: dados.distribution_date,
        currency: dados.currency,
        freeJustice: dados.free_justice,
        secrecyLevel: dados.secrecy_level,
        ...(dados.amount !== undefined && { amount: dados.amount }),
        // O status vem como string livre da Judit. Guardamos o valor original
        // em vez de tentar encaixá-lo no enum canônico e falhar.
        juditStatus: dados.status,
        courts: dados.courts as Prisma.InputJsonValue,
        classifications: dados.classifications as Prisma.InputJsonValue,
        subjects: dados.subjects as Prisma.InputJsonValue,
        parties: dados.partie as Prisma.InputJsonValue,
        updateStatus: ProcessUpdateStatus.DONE,
        lastActivityAt: new Date(),
      },
    });
  }

  /**
   * Grava os andamentos novos.
   *
   * A deduplicação é do banco: `@@unique([processId, stepId])`. O sistema
   * anterior comparava em memória, o que deixava passar duplicata sempre que
   * dois eventos chegassem ao mesmo tempo.
   */
  private async registrarAndamentos(
    processId: string,
    officeId: string,
    andamentos: AndamentoJudit[],
  ): Promise<void> {
    const validos = andamentos.filter(
      (a) => a.step_id && a.content && a.content.trim() !== '',
    );

    if (validos.length === 0) return;

    const { count } = await this.prisma.progress.createMany({
      data: validos.map((a) => ({
        officeId,
        processId,
        stepId: a.step_id,
        title: a.content?.slice(0, 120),
        description: a.content ?? '',
        releaseAt: a.step_date ? new Date(a.step_date) : null,
      })),
      // A constraint do banco recusa os repetidos; sem isso a inserção inteira
      // falharia por causa de um único andamento já conhecido.
      skipDuplicates: true,
    });

    if (count === 0) return;

    this.logger.log(`${count} andamento(s) novo(s) no processo ${processId}`);

    await this.notificar(processId, officeId, count);
  }

  private async notificar(
    processId: string,
    officeId: string,
    quantidade: number,
  ): Promise<void> {
    const processo = await this.prisma.process.findUnique({
      where: { id: processId },
      select: {
        number: true,
        customer: { select: { name: true } },
        office: { select: { ownerId: true } },
      },
    });

    if (!processo) return;

    await this.prisma.notification.create({
      data: {
        officeId,
        userId: processo.office.ownerId,
        type: NotificationType.PROGRESS_UPDATE,
        typeId: processId,
        typeTitle: `${processo.number.slice(0, 8)}… (${processo.customer.name})`,
        typeDetail: `${quantidade} novo(s) andamento(s)`,
      },
    });
  }
}
