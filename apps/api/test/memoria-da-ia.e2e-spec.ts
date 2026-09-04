import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentStyle,
  AgentType,
  ChatType,
  MarkAuthor,
  MarkCategory,
  MarkType,
} from '@cacia/database';
import { MemoriaService } from '@/ai/memoria/memoria.service';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarDuasContas, type Conta } from './apoio/contas';

/**
 * A memória do agente, contra Redis e PostgreSQL de verdade.
 *
 * É o sintoma que originou a reconstrução: "a IA não consegue manter um bom
 * atendimento por acúmulo no contexto". O diagnóstico mostrou o contrário do
 * relatado — não era acúmulo, era amnésia precoce. O sistema anterior mantinha
 * uma janela de 20 MENSAGENS, e cada turno com ferramenta consumia de 3 a 5
 * delas: a conversa útil durava de quatro a seis turnos.
 *
 * Estes testes existem para que isso não volte. Eles verificam o
 * comportamento da memória ao longo de uma conversa longa, com as três
 * camadas ligadas: Redis para os turnos recentes, Postgres para o resumo,
 * busca vetorial para os fatos.
 */

interface Cenario {
  conta: Conta;
  chatId: string;
  agentId: string;
  customerId: string;
}

describe('memória da IA (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let memoria: MemoriaService;
  let a: Cenario;
  let b: Cenario;

  async function prepararCenario(
    conta: Conta,
    sufixo: string,
  ): Promise<Cenario> {
    const agente = await conta.api.post<{ id: string }>('/agents', {
      type: AgentType.SUPPORT,
      style: AgentStyle.CLEAR_AND_OBJECTIVE,
      greeting: 'Olá! Como posso ajudar?',
    });

    const cliente = await conta.api.post<{ id: string }>('/customers', {
      name: `Cliente ${sufixo}`,
      document: `1111111111${sufixo}`,
      remotejid: `55119${sufixo}0000000@c.us`,
    });

    const chat = await aplicacao.prisma.chat.create({
      data: {
        officeId: conta.officeId,
        agentId: agente.corpo.id,
        customerId: cliente.corpo.id,
        type: ChatType.CUSTOMER,
      },
      select: { id: true },
    });

    return {
      conta,
      chatId: chat.id,
      agentId: agente.corpo.id,
      customerId: cliente.corpo.id,
    };
  }

  /** Cria a anotação e a indexa como fato recuperável. */
  async function registrarFato(
    cenario: Cenario,
    titulo: string,
  ): Promise<string> {
    const mark = await aplicacao.prisma.mark.create({
      data: {
        officeId: cenario.conta.officeId,
        chatId: cenario.chatId,
        customerId: cenario.customerId,
        type: MarkType.CUSTOMER,
        category: MarkCategory.PREFERENCE,
        author: MarkAuthor.AGENT,
        title: titulo,
      },
      select: { id: true },
    });

    await memoria.indexarFato({
      markId: mark.id,
      officeId: cenario.conta.officeId,
      chatId: cenario.chatId,
      customerId: cenario.customerId,
      conteudo: titulo,
    });

    return mark.id;
  }

  /** Simula uma conversa longa. */
  async function conversar(cenario: Cenario, turnos: number): Promise<void> {
    for (let i = 1; i <= turnos; i++) {
      await memoria.registrarTurno(cenario.chatId, {
        papel: 'user',
        conteudo: `Mensagem número ${i} do cliente.`,
      });
      await memoria.registrarTurno(cenario.chatId, {
        papel: 'assistant',
        conteudo: `Resposta número ${i} do agente.`,
      });
    }
  }

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    memoria = aplicacao.app.get(MemoriaService);

    const [contaA, contaB] = await criarDuasContas(aplicacao.url);
    a = await prepararCenario(contaA, '1');
    b = await prepararCenario(contaB, '2');
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('camada quente — os turnos recentes', () => {
    it('guarda os últimos turnos, literais', async () => {
      await conversar(a, 2);

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'e agora?',
      );

      expect(contexto.recentes).toHaveLength(4);
      expect(contexto.recentes.at(-1)).toEqual({
        papel: 'assistant',
        conteudo: 'Resposta número 2 do agente.',
      });
    });

    it('não cresce com a conversa — corta nos últimos', async () => {
      // O `ltrim` acontece a cada gravação. Sem ele, a lista cresceria sem
      // limite e o contexto junto.
      await memoria.limparCamadaQuente(a.chatId);
      await conversar(a, 30);

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'e agora?',
      );

      expect(contexto.recentes).toHaveLength(8);
      expect(contexto.recentes.at(-1)?.conteudo).toContain('número 30');
    });

    it('o tamanho do contexto não cresce com a duração da conversa', async () => {
      // A propriedade central. Uma conversa de 200 mensagens precisa ocupar o
      // mesmo espaço que uma de 10 — era exatamente isso que não acontecia.
      await memoria.limparCamadaQuente(a.chatId);
      await conversar(a, 5);
      const curta = memoria.formatarParaPrompt(
        await memoria.montarContexto(a.conta.officeId, a.chatId, 'oi'),
      );

      await conversar(a, 95);
      const longa = memoria.formatarParaPrompt(
        await memoria.montarContexto(a.conta.officeId, a.chatId, 'oi'),
      );

      const turnosCurta = (
        await memoria.montarContexto(a.conta.officeId, a.chatId, 'oi')
      ).recentes.length;

      expect(turnosCurta).toBe(8);
      // O texto do prompt varia por conteúdo, não por quantidade de mensagens
      expect(Math.abs(longa.length - curta.length)).toBeLessThan(200);
    });
  });

  describe('camada morna — o resumo', () => {
    it('sobrevive à perda da camada quente', async () => {
      // É o ponto do desenho: o Redis expira em 24h, e o que veio antes não
      // pode simplesmente desaparecer como acontecia antes.
      await memoria.gravarResumo(
        a.conta.officeId,
        a.chatId,
        'O cliente contratou o escritório para uma ação trabalhista em março.',
        50,
      );

      await memoria.limparCamadaQuente(a.chatId);

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'como está meu caso?',
      );

      expect(contexto.recentes).toHaveLength(0);
      expect(contexto.resumo).toContain('ação trabalhista');
    });

    it('entra no texto do prompt', async () => {
      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'como está meu caso?',
      );

      expect(memoria.formatarParaPrompt(contexto)).toContain(
        'ação trabalhista',
      );
    });

    it('o resumo de um escritório não aparece no outro', async () => {
      const contexto = await memoria.montarContexto(
        b.conta.officeId,
        b.chatId,
        'como está meu caso?',
      );

      expect(contexto.resumo).toBeNull();
    });

    it('gravar resumo em conversa de outro escritório não tem efeito', async () => {
      await memoria.gravarResumo(
        b.conta.officeId, // escritório errado para este chat
        a.chatId,
        'resumo injetado',
        1,
      );

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'como está meu caso?',
      );

      expect(contexto.resumo).toContain('ação trabalhista');
    });
  });

  describe('camada fria — os fatos permanentes', () => {
    it('recupera o fato dito no começo, muitos turnos depois', async () => {
      // O sintoma relatado pelo cliente, em forma de teste: a pessoa diz uma
      // preferência no primeiro turno e, cinquenta turnos depois, o agente
      // ainda precisa saber.
      await registrarFato(a, 'O cliente prefere ser chamado de Zé.');

      await conversar(a, 50);

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'o cliente prefere ser chamado como?',
      );

      expect(contexto.fatos.join(' ')).toContain('Zé');
    });

    it('traz poucos fatos, não todos', async () => {
      // Um cliente com cinquenta anotações não pode despejar as cinquenta no
      // contexto — o orçamento é fixo por construção.
      for (let i = 0; i < 10; i++) {
        await registrarFato(a, `O cliente prefere contato número ${i}.`);
      }

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'o cliente prefere contato como?',
      );

      expect(contexto.fatos.length).toBeLessThanOrEqual(3);
    });

    it('marca a anotação como indexada no banco', async () => {
      const markId = await registrarFato(a, 'O cliente mora em Santos.');

      const mark = await aplicacao.prisma.mark.findUnique({
        where: { id: markId },
        select: { vectorId: true, vectorIndexedAt: true },
      });

      expect(mark?.vectorId).toBe(markId);
      expect(mark?.vectorIndexedAt).toBeInstanceOf(Date);
    });

    it('o fato de um escritório NUNCA aparece no outro', async () => {
      await registrarFato(b, 'O cliente prefere ser chamado de Zé.');

      const contexto = await memoria.montarContexto(
        b.conta.officeId,
        b.chatId,
        'o cliente prefere ser chamado como?',
      );

      // O escritório B tem o seu próprio fato, com o mesmo texto — o que
      // prova que a busca achou o dele, e não o do A.
      expect(contexto.fatos).toHaveLength(1);
      // O escritório A tem muitos fatos indexados; o B tem exatamente um. Se a
      // busca ignorasse o escritório, viriam três — o teto por consulta.
      expect(
        aplicacao.qdrant.contarDoEscritorio(a.conta.officeId),
      ).toBeGreaterThan(1);
      expect(aplicacao.qdrant.contarDoEscritorio(b.conta.officeId)).toBe(1);
    });

    it('mensagem curta demais não dispara busca vetorial', async () => {
      // "ok" não tem sentido para recuperar nada, e a busca custa uma chamada
      // de embedding por mensagem.
      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        a.chatId,
        'ok',
      );

      expect(contexto.fatos).toEqual([]);
    });
  });

  describe('degradação', () => {
    it('conversa que nunca teve memória devolve contexto vazio, sem erro', async () => {
      const chat = await aplicacao.prisma.chat.create({
        data: {
          officeId: a.conta.officeId,
          agentId: a.agentId,
          customerId: a.customerId,
          type: ChatType.CUSTOMER,
        },
        select: { id: true },
      });

      const contexto = await memoria.montarContexto(
        a.conta.officeId,
        chat.id,
        'primeira mensagem desta conversa',
      );

      expect(contexto).toEqual({ recentes: [], resumo: null, fatos: [] });
      expect(memoria.formatarParaPrompt(contexto)).toBe('');
    });
  });
});
