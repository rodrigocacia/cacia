import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  AgentStyle,
  AgentType,
  ChatStatus,
  EventType,
  MessageSender,
} from '@cacia/database';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * A tela de Início: o resumo do dia sai de contagens, então cada número aqui
 * é conferido contra o que foi gravado.
 */

interface Inicio {
  madrugada: { atendidos: number; consultasMarcadas: number };
  aguardando: {
    total: number;
    itens: { chatId: string; nome: string; desde: string }[];
  };
  periodo: {
    leadsNovos: number;
    atendidos: number;
    consultas: number;
    serieLeads: number[];
  };
  agenda: { titulo: string }[];
  prazos: { titulo: string }[];
}

const H = 60 * 60 * 1000;

describe('Início (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;
  let outra: Conta;

  async function conversa(params: {
    nome: string;
    status: ChatStatus;
    mensagens: { de: MessageSender; ha: number }[];
  }) {
    const { prisma } = aplicacao;
    const officeId = conta.officeId;
    const agente = await prisma.agent.findFirstOrThrow({
      where: { officeId, type: AgentType.SUPPORT },
    });
    const etapa = await prisma.pipelineStage.findFirstOrThrow({
      where: { officeId },
      orderBy: { position: 'asc' },
    });
    const lead = await prisma.lead.create({
      data: {
        officeId,
        name: params.nome,
        remotejid: `55119${Math.floor(Math.random() * 1e8)}@c.us`,
        pipelineId: etapa.pipelineId,
        stageId: etapa.id,
      },
    });
    const chat = await prisma.chat.create({
      data: {
        officeId,
        agentId: agente.id,
        type: 'LEAD',
        leadId: lead.id,
        status: params.status,
      },
    });
    for (const m of params.mensagens) {
      await prisma.message.create({
        data: {
          officeId,
          chatId: chat.id,
          leadId: lead.id,
          sender: m.de,
          type: 'TEXT',
          messageText: 'oi',
          createdAt: new Date(Date.now() - m.ha * H),
        },
      });
    }
    return chat.id;
  }

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url, 'Escritório do Início');
    outra = await criarConta(aplicacao.url, 'Escritório Vizinho');

    for (const c of [conta, outra]) {
      await c.api.post('/agents', {
        type: AgentType.SUPPORT,
        style: AgentStyle.CLEAR_AND_OBJECTIVE,
        greeting: 'Olá',
      });
    }
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  it('lista quem espera a equipe, do mais antigo para o mais novo', async () => {
    const antiga = await conversa({
      nome: 'Espera Antiga',
      status: ChatStatus.PENDING,
      mensagens: [{ de: MessageSender.LEAD, ha: 5 }],
    });
    const recente = await conversa({
      nome: 'Espera Recente',
      status: ChatStatus.PENDING,
      mensagens: [{ de: MessageSender.CUSTOMER, ha: 1 }],
    });
    // Já respondida pela equipe: não espera ninguém
    await conversa({
      nome: 'Já Respondida',
      status: ChatStatus.PENDING,
      mensagens: [
        { de: MessageSender.LEAD, ha: 3 },
        { de: MessageSender.USER, ha: 2 },
      ],
    });
    // Com a assistente: ela responde sozinha, não entra na lista
    await conversa({
      nome: 'Com a Assistente',
      status: ChatStatus.ACTIVE,
      mensagens: [{ de: MessageSender.LEAD, ha: 4 }],
    });

    const r = await conta.api.get<Inicio>('/dashboard/home');

    expect(r.status).toBe(200);
    expect(r.corpo.aguardando.total).toBe(2);
    expect(r.corpo.aguardando.itens.map((i) => i.chatId)).toEqual([
      antiga,
      recente,
    ]);
    expect(r.corpo.aguardando.itens[0]?.nome).toBe('Espera Antiga');
  });

  it('conta conversas atendidas pela assistente, não mensagens', async () => {
    await conversa({
      nome: 'Duas Respostas',
      status: ChatStatus.ACTIVE,
      mensagens: [
        { de: MessageSender.AGENT, ha: 0.5 },
        { de: MessageSender.AGENT, ha: 0.4 },
      ],
    });

    const r = await conta.api.get<Inicio>('/dashboard/home?periodo=semana');

    expect(r.corpo.periodo.atendidos).toBe(1);
    expect(r.corpo.periodo.leadsNovos).toBeGreaterThanOrEqual(5);
    expect(r.corpo.periodo.serieLeads).toHaveLength(7);
  });

  it('traz a agenda de hoje e os prazos, sem os cancelados', async () => {
    const agenda = await aplicacao.prisma.calendar.create({
      data: {
        officeId: conta.officeId,
        userId: conta.userId,
        title: 'Agenda do teste',
      },
    });
    const daqui = (h: number) => new Date(Date.now() + h * H);
    const evento = (titulo: string, tipo: EventType, ini: Date, extra = {}) =>
      aplicacao.prisma.event.create({
        data: {
          officeId: conta.officeId,
          calendarId: agenda.id,
          type: tipo,
          title: titulo,
          startTime: ini,
          endTime: new Date(ini.getTime() + H),
          ...extra,
        },
      });

    await evento('Prazo de contestação', EventType.DEADLINE, daqui(48));
    await evento('Prazo cancelado', EventType.DEADLINE, daqui(50), {
      status: 'CANCEL',
    });

    const r = await conta.api.get<Inicio>('/dashboard/home');

    expect(r.corpo.prazos.map((p) => p.titulo)).toEqual([
      'Prazo de contestação',
    ]);
  });

  it('recusa período desconhecido', async () => {
    const r = await conta.api.get('/dashboard/home?periodo=ano');
    expect(r.status).toBe(400);
  });

  it('não mostra nada de outro escritório', async () => {
    const r = await outra.api.get<Inicio>('/dashboard/home');

    expect(r.corpo.aguardando.total).toBe(0);
    expect(r.corpo.periodo.atendidos).toBe(0);
    expect(r.corpo.prazos).toHaveLength(0);
    expect(randomUUID()).toBeTruthy();
  });
});
