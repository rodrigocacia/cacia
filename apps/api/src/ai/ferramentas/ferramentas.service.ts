import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { EventStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RagService } from '../rag/rag.service';

export interface ContextoFerramenta {
  officeId: string;
  chatId: string;
  customerId?: string;
  leadId?: string;
}

/**
 * Ferramentas disponíveis ao agente.
 *
 * Todas recebem o contexto pelo servidor, nunca pelo modelo: se o officeId
 * viesse nos argumentos da ferramenta, uma injeção de prompt bastaria para ler
 * dados de outro escritório.
 */
@Injectable()
export class FerramentasService {
  private readonly logger = new Logger(FerramentasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
  ) {}

  /** Definições enviadas ao modelo. */
  definicoes(): ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'buscar_em_documentos',
          description:
            'Procura informação nos documentos do cliente. Use quando a pergunta ' +
            'for sobre o conteúdo de um contrato, petição ou processo.',
          parameters: {
            type: 'object',
            properties: {
              pergunta: {
                type: 'string',
                description:
                  'O que precisa ser encontrado, em linguagem natural',
              },
            },
            required: ['pergunta'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'consultar_processos',
          description:
            'Lista os processos do cliente com número, status e última movimentação.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'consultar_agenda',
          description:
            'Lista os próximos compromissos do cliente com data e horário.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'horarios_disponiveis',
          description:
            'Mostra os horários em que o escritório atende, para agendar consulta.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'acionar_atendente',
          description:
            'Encaminha a conversa para uma pessoa. Use quando o cliente pedir, ' +
            'quando o assunto exigir avaliação jurídica ou quando você não souber responder.',
          parameters: {
            type: 'object',
            properties: {
              motivo: {
                type: 'string',
                description: 'Por que o atendimento humano é necessário',
              },
            },
            required: ['motivo'],
          },
        },
      },
    ];
  }

  /**
   * Executa a ferramenta e devolve texto pronto para o modelo.
   *
   * O retorno é texto, não JSON: o modelo lê melhor, e — mais importante — o
   * que volta para a memória é o FATO, não a estrutura. Guardar JSON bruto na
   * memória foi o que consumiu a janela de contexto do sistema anterior.
   */
  async executar(
    nome: string,
    argumentos: Record<string, unknown>,
    contexto: ContextoFerramenta,
  ): Promise<string> {
    try {
      switch (nome) {
        case 'buscar_em_documentos':
          return await this.buscarEmDocumentos(
            String(argumentos.pergunta ?? ''),
            contexto,
          );
        case 'consultar_processos':
          return await this.consultarProcessos(contexto);
        case 'consultar_agenda':
          return await this.consultarAgenda(contexto);
        case 'horarios_disponiveis':
          return await this.horariosDisponiveis(contexto);
        case 'acionar_atendente':
          return await this.acionarAtendente(
            String(argumentos.motivo ?? ''),
            contexto,
          );
        default:
          return `Ferramenta desconhecida: ${nome}`;
      }
    } catch (erro) {
      this.logger.error(
        `Falha na ferramenta ${nome}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      // Devolve texto em vez de lançar: o modelo consegue seguir a conversa
      // dizendo que não conseguiu consultar, o que é melhor que a resposta
      // inteira falhar.
      return 'Não consegui consultar essa informação agora.';
    }
  }

  private async buscarEmDocumentos(
    pergunta: string,
    contexto: ContextoFerramenta,
  ): Promise<string> {
    if (!contexto.customerId) {
      return 'Este contato ainda não é cliente, então não há documentos.';
    }

    const trechos = await this.rag.buscar({
      officeId: contexto.officeId,
      customerId: contexto.customerId,
      pergunta,
    });

    if (trechos.length === 0) {
      return 'Nenhum trecho relevante encontrado nos documentos deste cliente.';
    }

    return trechos
      .map((t, i) => `[${i + 1}] ${t.documento}: ${t.conteudo}`)
      .join('\n\n');
  }

  private async consultarProcessos(
    contexto: ContextoFerramenta,
  ): Promise<string> {
    if (!contexto.customerId) {
      return 'Este contato ainda não é cliente, então não há processos.';
    }

    const processos = await this.prisma.process.findMany({
      where: {
        officeId: contexto.officeId,
        customerId: contexto.customerId,
        deletedAt: null,
      },
      select: {
        number: true,
        status: true,
        phase: true,
        tribunalAcronym: true,
        lastActivityAt: true,
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 10,
    });

    if (processos.length === 0) return 'Nenhum processo cadastrado.';

    return processos
      .map(
        (p) =>
          `Processo ${p.number} — ${p.status}${
            p.phase ? `, fase: ${p.phase}` : ''
          }${p.tribunalAcronym ? ` (${p.tribunalAcronym})` : ''}`,
      )
      .join('\n');
  }

  private async consultarAgenda(contexto: ContextoFerramenta): Promise<string> {
    const eventos = await this.prisma.event.findMany({
      where: {
        officeId: contexto.officeId,
        deletedAt: null,
        startTime: { gte: new Date() },
        status: { not: EventStatus.CANCEL },
        ...(contexto.customerId
          ? { customerId: contexto.customerId }
          : { leadId: contexto.leadId }),
      },
      select: { title: true, startTime: true, consultationMode: true },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    if (eventos.length === 0) return 'Nenhum compromisso agendado.';

    return eventos
      .map((e) => {
        const quando = e.startTime.toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        });
        return `${e.title} em ${quando}${
          e.consultationMode === 'ONLINE' ? ' (online)' : ''
        }`;
      })
      .join('\n');
  }

  private async horariosDisponiveis(
    contexto: ContextoFerramenta,
  ): Promise<string> {
    const agendas = await this.prisma.calendar.findMany({
      where: { officeId: contexto.officeId, status: true, deletedAt: null },
      select: {
        title: true,
        availableDays: {
          where: { available: true },
          select: { day: true, startTime: true, endTime: true },
        },
      },
    });

    if (agendas.length === 0) return 'Nenhuma agenda configurada.';

    return agendas
      .map((a) => {
        const dias = a.availableDays
          .map((d) => `${d.day} das ${d.startTime} às ${d.endTime}`)
          .join('; ');
        return `${a.title}: ${dias || 'sem horários definidos'}`;
      })
      .join('\n');
  }

  /**
   * Marca a conversa para atendimento humano.
   *
   * Não envia mensagem nenhuma — quem comunica é o modelo, na resposta. Aqui só
   * muda o estado, para que a conversa apareça na fila do atendente.
   */
  private async acionarAtendente(
    motivo: string,
    contexto: ContextoFerramenta,
  ): Promise<string> {
    await this.prisma.chat.updateMany({
      where: { id: contexto.chatId, officeId: contexto.officeId },
      data: { status: 'PENDING' },
    });

    this.logger.log(
      `Atendimento humano acionado na conversa ${contexto.chatId}: ${motivo}`,
    );

    return 'Atendente acionado. Avise a pessoa que alguém do escritório vai continuar o atendimento.';
  }
}
