import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { EventStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { LeadsService } from '@/modules/leads/leads.service';
import { TagsService } from '@/modules/tags/tags.service';
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
    private readonly leads: LeadsService,
    private readonly tags: TagsService,
  ) {}

  /**
   * O que o escritorio autoriza o agente a fazer no funil.
   *
   * Lido a cada resposta, e nao guardado: desligar o portao na tela precisa
   * valer na proxima mensagem, nao no proximo reinicio. E uma consulta por
   * chave unica — barata perto do resto de uma resposta do agente.
   */
  private async permissoes(officeId: string): Promise<{
    moverEtapa: boolean;
    etiquetar: boolean;
  }> {
    const config = await this.prisma.setting.findUnique({
      where: { officeId },
      select: { aiCanMoveLeadStage: true, aiCanTagLead: true },
    });

    return {
      moverEtapa: config?.aiCanMoveLeadStage ?? false,
      etiquetar: config?.aiCanTagLead ?? false,
    };
  }

  /**
   * Definicoes enviadas ao modelo.
   *
   * Depende do escritorio: as ferramentas de funil so entram na lista quando o
   * escritorio as ligou, e a descricao delas carrega os nomes reais das etapas
   * e etiquetas. Sem isso o modelo teria de adivinhar como a coluna se chama —
   * e adivinharia errado.
   */
  async definicoes(
    contexto: ContextoFerramenta,
  ): Promise<ChatCompletionTool[]> {
    const ferramentas: ChatCompletionTool[] = [
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

    // Sem lead nao ha funil que mova: quem ja e cliente saiu do funil, e a
    // conversa interna com um usuario do escritorio nunca esteve nele.
    if (!contexto.leadId) return ferramentas;

    const permitido = await this.permissoes(contexto.officeId);

    if (permitido.moverEtapa) {
      const etapas = await this.etapasDoLead(contexto);

      if (etapas.length > 0) {
        ferramentas.push({
          type: 'function',
          function: {
            name: 'mover_etapa',
            description:
              'Move este contato para outra etapa do funil de vendas. Use quando ' +
              'a conversa mostrar que o negócio avançou ou foi descartado. ' +
              `Etapas disponíveis: ${etapas.map((e) => e.name).join(', ')}.`,
            parameters: {
              type: 'object',
              properties: {
                etapa: {
                  type: 'string',
                  enum: etapas.map((e) => e.name),
                  description: 'Nome exato da etapa de destino',
                },
                motivo: {
                  type: 'string',
                  description:
                    'Obrigatório ao mover para uma etapa de perda: por que o negócio não seguiu',
                },
              },
              required: ['etapa'],
            },
          },
        });
      }
    }

    if (permitido.etiquetar) {
      const etiquetas = await this.etiquetasDoEscritorio(contexto.officeId);

      if (etiquetas.length > 0) {
        ferramentas.push({
          type: 'function',
          function: {
            name: 'etiquetar',
            description:
              'Aplica etiquetas já cadastradas a este contato, substituindo as ' +
              'atuais. Use para registrar assunto ou perfil que a conversa revelou. ' +
              'Não é possível criar etiqueta nova.',
            parameters: {
              type: 'object',
              properties: {
                etiquetas: {
                  type: 'array',
                  items: { type: 'string', enum: etiquetas.map((e) => e.name) },
                  description: 'Conjunto completo de etiquetas do contato',
                },
              },
              required: ['etiquetas'],
            },
          },
        });
      }
    }

    return ferramentas;
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
        case 'mover_etapa':
          return await this.moverEtapa(
            String(argumentos.etapa ?? ''),
            argumentos.motivo === undefined
              ? undefined
              : String(argumentos.motivo),
            contexto,
          );
        case 'etiquetar':
          return await this.etiquetar(
            Array.isArray(argumentos.etiquetas)
              ? argumentos.etiquetas.map((e) => String(e))
              : [],
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

  /**
   * Etapas do funil em que o lead esta, para oferecer ao modelo.
   *
   * Do funil DO LEAD, nao do padrao: um escritorio com dois funis moveria o
   * contato para a coluna de outro processo comercial.
   */
  private async etapasDoLead(
    contexto: ContextoFerramenta,
  ): Promise<Array<{ id: string; name: string }>> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: contexto.leadId,
        officeId: contexto.officeId,
        deletedAt: null,
      },
      select: { pipelineId: true },
    });

    if (!lead?.pipelineId) return [];

    return this.prisma.pipelineStage.findMany({
      where: {
        officeId: contexto.officeId,
        pipelineId: lead.pipelineId,
        deletedAt: null,
      },
      select: { id: true, name: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private async etiquetasDoEscritorio(
    officeId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    return this.prisma.tag.findMany({
      where: { officeId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  /**
   * Move o lead de etapa, em nome do agente.
   *
   * A permissao e conferida AQUI de novo, e nao so na montagem da lista: o
   * nome da ferramenta viaja no texto que o modelo produz, e um prompt
   * injetado na mensagem do contato pode pedir uma ferramenta que nunca foi
   * oferecida. Conferir uma vez so seria confiar na saida do modelo.
   *
   * A escrita passa pelo LeadsService, nao pelo Prisma direto: e la que a
   * projecao do status e o registro no historico acontecem, e um caminho
   * paralelo criaria um lead que mudou de etapa sem deixar rastro.
   */
  private async moverEtapa(
    nomeDaEtapa: string,
    motivo: string | undefined,
    contexto: ContextoFerramenta,
  ): Promise<string> {
    if (!contexto.leadId) {
      return 'Este contato não está no funil, então não há etapa para mover.';
    }

    const permitido = await this.permissoes(contexto.officeId);

    if (!permitido.moverEtapa) {
      return 'Não tenho permissão para mover contatos no funil deste escritório.';
    }

    const etapas = await this.etapasDoLead(contexto);
    const alvo = etapas.find(
      (e) => e.name.toLowerCase() === nomeDaEtapa.trim().toLowerCase(),
    );

    if (!alvo) {
      return `Etapa "${nomeDaEtapa}" não existe. As etapas são: ${etapas
        .map((e) => e.name)
        .join(', ')}.`;
    }

    try {
      await this.leads.moverEtapa(
        contexto.officeId,
        contexto.leadId,
        { stageId: alvo.id, lostReason: motivo },
        // userId nulo: foi o agente. E o que permite reconhecer, na linha do
        // tempo, um cartao que andou sozinho.
        null,
      );
    } catch (erro) {
      // Regra de negocio recusada (ja esta na etapa, motivo faltando) e
      // resposta legitima para o modelo, nao falha da ferramenta.
      return erro instanceof Error
        ? `Não foi possível mover: ${erro.message}`
        : 'Não foi possível mover o contato de etapa.';
    }

    this.logger.log(
      `Agente moveu o lead ${contexto.leadId} para a etapa ${alvo.name}`,
    );

    return `Contato movido para a etapa "${alvo.name}".`;
  }

  /**
   * Aplica etiquetas existentes ao lead.
   *
   * Nome que nao existe e ignorado e reportado ao modelo, em vez de criar a
   * etiqueta: deixar o modelo inventar nome transforma o filtro da tela em
   * lixo — "urgente", "Urgente" e "urgencia" virariam tres etiquetas.
   */
  private async etiquetar(
    nomes: string[],
    contexto: ContextoFerramenta,
  ): Promise<string> {
    if (!contexto.leadId) {
      return 'Este contato não está no funil, então não há o que etiquetar.';
    }

    const permitido = await this.permissoes(contexto.officeId);

    if (!permitido.etiquetar) {
      return 'Não tenho permissão para etiquetar contatos deste escritório.';
    }

    const existentes = await this.etiquetasDoEscritorio(contexto.officeId);
    const porNome = new Map(
      existentes.map((e) => [e.name.toLowerCase(), e.id]),
    );

    const encontradas: string[] = [];
    const desconhecidas: string[] = [];

    for (const nome of nomes) {
      const id = porNome.get(nome.trim().toLowerCase());
      if (id) encontradas.push(id);
      else desconhecidas.push(nome);
    }

    await this.leads.definirEtiquetas(
      contexto.officeId,
      contexto.leadId,
      encontradas,
    );

    const aplicadas = existentes
      .filter((e) => encontradas.includes(e.id))
      .map((e) => e.name);

    const resumo =
      aplicadas.length > 0
        ? `Etiquetas do contato agora: ${aplicadas.join(', ')}.`
        : 'O contato ficou sem etiquetas.';

    return desconhecidas.length > 0
      ? `${resumo} Não existem estas etiquetas: ${desconhecidas.join(', ')}.`
      : resumo;
  }
}
